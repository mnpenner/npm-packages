#!/usr/bin/env node
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, type ParseArgsConfig } from 'node:util'
import cssesc from 'cssesc'
import he from 'he'
import sanitizeFileName from 'sanitize-filename'
import ttf2woff2 from 'ttf2woff2'

import { readDirDeep } from './util.js'

const require = createRequire(import.meta.url)

const SVGIcons2SVGFontStream = require('svgicons2svgfont')
const svg2ttf = require('svg2ttf')
const ttf2woff = require('ttf2woff')
const ttf2eot = require('ttf2eot')
const { camelCase } = require('lodash') as { camelCase(value: string): string }
const { version } = require('../package.json') as { version: string }

const PARSE_CONFIG = {
    options: {
        help: {
            type: 'boolean',
            short: 'h',
        },
        version: {
            type: 'boolean',
            short: 'v',
        },
        'out-dir': {
            type: 'string',
            short: 'o',
        },
        'font-name': {
            type: 'string',
            short: 'n',
        },
        file: {
            type: 'string',
            short: 'f',
        },
        prefix: {
            type: 'string',
            short: 'p',
        },
        base: {
            type: 'string',
            short: 'b',
        },
        'directory-separator': {
            type: 'string',
        },
        'fixed-width': {
            type: 'boolean',
        },
        'codepoint-file': {
            type: 'string',
        },
        'nested-css': {
            type: 'boolean',
        },
        'ie-compat': {
            type: 'boolean',
        },
    },
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

interface CliArgs {
    src: string
    out_dir?: string
    font_name?: string
    file?: string
    prefix?: string
    base?: string
    directory_separator: string
    fixed_width: boolean
    codepoint_file?: string
    nested_css: boolean
    ie_compat: boolean
}

interface GlyphStream extends fs.ReadStream {
    metadata: {
        unicode: string[]
        name: string
    }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
    return err instanceof Error && 'code' in err
}

function commandName(): string {
    return path.basename(process.argv[1] ?? 'svg2fonts')
}

function printHelp(): void {
    console.log(`Converts a directory full of SVG icons into webfonts.

Usage:
  svg2fonts [options] <src>

Options:
  -h, --help                       Show this help text
  -v, --version                    Show the package version
  -o, --out-dir <dir>              Output directory
  -n, --font-name <name>           Font name
  -f, --file <name>                Output filenames without extension
  -p, --prefix <prefix>            CSS class name prefix
  -b, --base <class>               CSS class name added to all icons
      --directory-separator <sep>  String to use in CSS class names for sub-directories
      --codepoint-file <file>      JSON file to read and write icon code points
      --nested-css                 Nest icon selectors inside the base CSS selector
      --ie-compat                  Emit EOT/WOFF files and CSS for legacy IE support
      --fixed-width                Create a monospace font of the width of the largest input icon`)
}

function createFonts(files: {
    svgFontFile: string
    ttfFontFile: string
    woffFontFile: string
    woff2FontFile: string
    eotFile: string
    ieCompat: boolean
}): void {
    const svgString = fs.readFileSync(files.svgFontFile, { encoding: 'utf8' })
    const ttf = svg2ttf(svgString, {})
    fs.writeFileSync(files.ttfFontFile, ttf.buffer)
    console.log(`Wrote ${files.ttfFontFile}`)

    const ttfBuffer = fs.readFileSync(files.ttfFontFile)
    fs.writeFileSync(files.woff2FontFile, ttf2woff2(ttfBuffer))
    console.log(`Wrote ${files.woff2FontFile}`)

    if (files.ieCompat) {
        const woff = ttf2woff(ttfBuffer, {})
        fs.writeFileSync(files.woffFontFile, woff.buffer)
        console.log(`Wrote ${files.woffFontFile}`)

        fs.writeFileSync(files.eotFile, ttf2eot(ttfBuffer).buffer)
        console.log(`Wrote ${files.eotFile}`)
    }
}

async function main(options: Options, positionals: Positionals): Promise<number | void> {
    if (options.version) {
        console.log(version)
        return 0
    }

    if (options.help) {
        printHelp()
        return 0
    }

    if (positionals.length !== 1) {
        console.error(`${commandName()}: Expected exactly one source directory.`)
        printHelp()
        return 1
    }

    const args: CliArgs = {
        src: positionals[0],
        out_dir: options['out-dir'],
        font_name: options['font-name'],
        file: options.file,
        prefix: options.prefix,
        base: options.base,
        directory_separator: options['directory-separator'] ?? '-',
        fixed_width: options['fixed-width'] ?? false,
        codepoint_file: options['codepoint-file'],
        nested_css: options['nested-css'] ?? false,
        ie_compat: options['ie-compat'] ?? false,
    }

    if (!args.prefix && !args.base) {
        console.error(
            `${commandName()}: Not enough arguments. Either --prefix, --base or both must be provided.`,
        )
        return 1
    }

    if (args.nested_css && !args.base) {
        console.error(`${commandName()}: --nested-css requires --base.`)
        return 1
    }

    const cssStr = (s: string): string => cssesc(s, { wrap: true })
    const cssId = (s: string): string => cssesc(s, { isIdentifier: true })

    const inputDir = args.src
    const outputDir = args.out_dir || '.'
    const fontName = args.font_name || path.basename(inputDir)
    const fileName = args.file || sanitizeFileName(fontName)
    const cssPrefix = args.prefix || ''
    const cssBase = args.base || null

    const svgFontFile = `${outputDir}/${fileName}.svg`
    const ttfFontFile = `${outputDir}/${fileName}.ttf`
    const woffFontFile = `${outputDir}/${fileName}.woff`
    const woff2FontFile = `${outputDir}/${fileName}.woff2`
    const eotFile = `${outputDir}/${fileName}.eot`
    const cssFile = `${outputDir}/${fileName}.css`
    const htmlFile = `${outputDir}/${fileName}.html`
    const jsFile = `${outputDir}/${fileName}.js`
    const codePointFile = args.codepoint_file ?? `${outputDir}/${fileName}-chars.json`

    fs.mkdirSync(outputDir, {recursive: true})

    const fontStream = new SVGIcons2SVGFontStream({
        fontName: fontName,
        normalize: true,
        fontHeight: 5000,
        fixedWidth: args.fixed_width,
        centerHorizontally: true,
        log: () => {},
    })

    const svgFileStream = fs.createWriteStream(svgFontFile)
    const fontFiles = {
        svgFontFile,
        ttfFontFile,
        woffFontFile,
        woff2FontFile,
        eotFile,
        ieCompat: args.ie_compat,
    }
    const fontDone = new Promise<void>((resolve, reject) => {
        fontStream
            .pipe(svgFileStream)
            .on('finish', function () {
                console.log(`Wrote ${svgFontFile}`)
                createFonts(fontFiles)
                resolve()
            })
            .on('error', reject)
    })

    let icons = await readDirDeep(inputDir)
    icons = icons.filter((filename) => /\.svg$/i.test(filename))
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    icons.sort(collator.compare)

    let codePointCounter = 0xf000

    const cssDir = path.dirname(cssFile)
    const htmlDir = path.dirname(htmlFile)

    const cssBaseSelector = cssBase
        ? `.${cssId(cssBase)}`
        : `[class^="${cssId(cssPrefix)}"], [class*=" ${cssId(cssPrefix)}"]`
    const fontFaceSrc = args.ie_compat
        ? `  src: url(${cssStr(path.relative(cssDir, eotFile))}); /* IE9 Compat Modes */
  src: url(${cssStr(path.relative(cssDir, eotFile) + '?iefix')}) format('embedded-opentype'), /* IE6-IE8 */
    url(${cssStr(path.relative(cssDir, woff2FontFile))}) format('woff2'), /* Edge 14+, Chrome 36+, Firefox 39+, some mobile */
    url(${cssStr(path.relative(cssDir, woffFontFile))}) format('woff'),  /* IE 9+, Edge, Firefox 3.6+, Chrome 5+, Safari 5.1+ */
    url(${cssStr(path.relative(cssDir, ttfFontFile))}) format('truetype'), /* Safari, Android, iOS */
    url(${cssStr(path.relative(cssDir, svgFontFile))}) format('svg'); /* Legacy iOS */`
        : `  src: url(${cssStr(path.relative(cssDir, woff2FontFile))}) format('woff2'), /* Edge 14+, Chrome 36+, Firefox 39+, some mobile */
    url(${cssStr(path.relative(cssDir, ttfFontFile))}) format('truetype'), /* Safari, Android, iOS */
    url(${cssStr(path.relative(cssDir, svgFontFile))}) format('svg'); /* Legacy iOS */`

    let css = `
@font-face {
  font-family: ${cssStr(fontName)};
${fontFaceSrc}
  font-weight: normal;
  font-style: normal;
}
${cssBaseSelector} {
  font-family: ${cssStr(fontName)} !important; /* Use !important to prevent issues with browser extensions that change fonts */
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  text-rendering: optimizeSpeed; /* Kerning and ligatures aren't needed */
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
`.trimStart()

    const cssIcons: string[] = []
    const htmlIcons: string[] = []
    const iconMap: Record<string, string> = {}
    let codePointMap: Record<string, number> = {}
    let loadedCodePointFile = false

    try {
        codePointMap = JSON.parse(fs.readFileSync(codePointFile, { encoding: 'utf8' })) as Record<
            string,
            number
        >
        loadedCodePointFile = true
        const codePoints = Object.values(codePointMap)
        if (codePoints.length > 0) {
            codePointCounter = Math.max(...codePoints) + 1
        }
        console.log(`Found '${codePointFile}', using existing code points`)
    } catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            console.log(`'${codePointFile}' not found, generating new code points`)
        } else {
            throw err
        }
    }

    const seenCodePointKeys = new Set<string>()

    for (const icon of icons) {
        const glyph = fs.createReadStream(icon) as GlyphStream

        const relPath = path.relative(inputDir, icon)
        const iconName = relPath.slice(0, -4).replace(/[/\\]+/g, args.directory_separator)
        seenCodePointKeys.add(relPath)

        if (!codePointMap[relPath]) {
            codePointMap[relPath] = codePointCounter++
            if (loadedCodePointFile) {
                console.log(`Added code point for '${relPath}'`)
            }
        }

        const iconChar = String.fromCodePoint(codePointMap[relPath])

        glyph.metadata = {
            unicode: [iconChar],
            name: iconName,
        }
        fontStream.write(glyph)

        const className = `${cssPrefix}${iconName}`

        let cssSelector = `.${cssId(className)}`
        if (!cssPrefix && cssBase) {
            cssSelector = `.${cssId(cssBase)}${cssSelector}`
        }

        let htmlClass = className
        if (cssBase) {
            htmlClass = `${cssBase} ${htmlClass}`
        }

        if (args.nested_css) {
            cssIcons.push(`  &.${cssId(className)}:before {
    content: ${cssStr(iconChar)}
  }`)
        } else {
            cssIcons.push(`${cssSelector}:before {
  content: ${cssStr(iconChar)}
}`)
        }

        htmlIcons.push(
            `<a href="" class="s2i__icon-link"><i class="${he.escape(htmlClass)}"></i><span class="s2i__classname">${he.escape(htmlClass)}</span></a>`,
        )
        iconMap[camelCase(iconName)] = htmlClass
    }

    if (loadedCodePointFile) {
        for (const relPath of Object.keys(codePointMap).sort()) {
            if (!seenCodePointKeys.has(relPath)) {
                console.log(`Missing icon for existing code point '${relPath}'`)
            }
        }
    }

    if (args.nested_css) {
        css += `${cssIcons.length > 0 ? `\n${cssIcons.join('\n')}` : ''}
}
`
    } else {
        css += `}
${cssIcons.join('\n')}`
    }

    fontStream.end()

    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${he.escape(fontName)} Preview</title>
    <link rel="stylesheet" href="${he.escape(path.relative(htmlDir, cssFile))}">
    <style>
        .s2i__page-title {
            font-family: Helvetica, Arial, Sans-Serif;
            margin: 20px 0 10px 0;
        }
        .s2i__page-wrap {
            margin: 0 auto;
            max-width: 1000px;
            padding: 0 1rem;
        }
        .s2i__container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            grid-gap: 3px;
        }
        .s2i__icon-link {
            display: block;
            text-align: center;
            border: 1px solid #ccc;
            padding: 5px;
            text-decoration: none;
            color: black;
            overflow: hidden;
        }
        .s2i__icon-link:hover {
            background-color: #3af;
            color: white;
            border-color: #2E99E6;
        }
        .s2i__icon-link > i {
            font-size: 32px;
            background-color: #e8e8e8;
        }
        .s2i__icon-link:hover > i {
            background-color: #2E99E6;
        }
        .s2i__classname {
            display: block;
            font-family: monospace;
            font-size: 10px;
            white-space: nowrap;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    </style>
  </head>
  <body>
    <div class="s2i__page-wrap">
        <h1 class="s2i__page-title">${he.escape(fontName)}</h1>
        <div class="s2i__container">
            ${htmlIcons.join('\n            ')}
        </div>
    </div>
    <script>
        Array.prototype.forEach.call(document.querySelectorAll( '.s2i__icon-link' ), function (a) {
            a.addEventListener('click', function(ev) {
                ev.preventDefault();
                let classname = a.querySelector('.s2i__classname');
                if(classname) {
                    let range = document.createRange();
                    range.selectNodeContents(classname);
                    let selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    document.execCommand("Copy", false, null);
                }
            }, false );
        });
    </script>
  </body>
</html>
`.trimStart()

    await Promise.all([
        fs.promises.writeFile(jsFile, `export default ${JSON.stringify(iconMap, null, 4)};`, {
            encoding: 'utf8',
        }),
        fs.promises.writeFile(cssFile, css, { encoding: 'utf8' }),
        fs.promises.writeFile(codePointFile, JSON.stringify(codePointMap, null, 4), {
            encoding: 'utf8',
        }),
        fs.promises.writeFile(htmlFile, html, { encoding: 'utf8' }),
        fontDone,
    ])

    console.log(`Wrote ${jsFile}`)
    console.log(`Wrote ${cssFile}`)
    console.log(`Wrote ${codePointFile}`)
    console.log(`Wrote ${htmlFile}`)
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig['values']
type Positionals = ParsedConfig['positionals']

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const { values, positionals } = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
        (exitCode) => {
            if (typeof exitCode === 'number') {
                process.exitCode = exitCode
            }
        },
        (err) => {
            console.error(err ?? 'An unknown error occurred')
            process.exitCode = 1
        },
    )
}
//#endregion
