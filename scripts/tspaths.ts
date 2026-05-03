#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import { applyEdits, modify } from 'jsonc-parser'
import { readFileSync } from 'fs'
import fg from 'fast-glob'
import { dirname, join, resolve, relative } from 'node:path/posix'
import { writeFileSync } from 'node:fs'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const root = resolve(__dirname, '..')

    const tsconfigPath = 'tsconfig.json'
    let text = readFileSync(tsconfigPath, 'utf8')

    // parse
    //     const data = parse(text);

    // const edits = modify(text, ['compilerOptions','paths','@mpen/base50'],['ooga booga'],{})

    const formattingOptions = {
        // insertSpaces: true,
        // tabSize: 2,
    }

    const tsdowns = await fg('packages/*/tsdown.config.ts')

    // WARNING! This won't work if the entry uses globs or something. tsdown supports complicated entries... https://tsdown.dev/options/entry if this fails we might consider tapping into whatever voodoo they do
    for (const tsdown of tsdowns) {
        let entry = await import(tsdown).then((m) => m.default.entry)
        const dir = dirname(tsdown)
        const pkgPath = join(dir, 'package.json')

        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

        // console.log(pkg.name)

        function resolveEntry(entry: string | string[]) {
            if (!Array.isArray(entry)) entry = [entry]

            return entry.map((e) => relative(root, join(dir, e)))
        }

        if (Array.isArray(entry) || typeof entry === 'string') {
            text = applyEdits(
                text,
                modify(text, ['compilerOptions', 'paths', pkg.name], resolveEntry(entry), {
                    formattingOptions,
                }),
            )
        } else if (typeof entry === 'object') {
            const values = Object.values(entry)
            if (values.length === 1) {
                text = applyEdits(
                    text,
                    modify(
                        text,
                        ['compilerOptions', 'paths', pkg.name],
                        resolveEntry(values[0] as string),
                        {
                            formattingOptions,
                        },
                    ),
                )
            } else {
                for (const [key, value] of Object.entries(entry)) {
                    const pkgPath = key === 'index' ? pkg.name : join(pkg.name, key)

                    text = applyEdits(
                        text,
                        modify(
                            text,
                            ['compilerOptions', 'paths', pkgPath],
                            resolveEntry(value as string),
                            {
                                formattingOptions,
                            },
                        ),
                    )
                }
            }
        } else {
            console.error(`Invalid entry for ${pkg.name}`, entry)
        }

        // console.log(config)
    }

    // console.log(text)
    // const updated = applyEdits(text, edits)

    writeFileSync(tsconfigPath, text)

    return 0
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig['values']
type Positionals = ParsedConfig['positionals']

if (import.meta.main) {
    const { values, positionals } = parseArgs(PARSE_CONFIG)

    Promise.try(main, values, positionals).then(
        (exitCode) => {
            if (typeof exitCode === 'number') {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if (err instanceof $.ShellError) {
                console.error(`Command failed with exit code ${err.exitCode}`)
                process.exitCode = err.exitCode
            } else {
                console.error(err ?? 'An unknown error occurred')
                process.exitCode = 1
            }
        },
    )
}
//#endregion
