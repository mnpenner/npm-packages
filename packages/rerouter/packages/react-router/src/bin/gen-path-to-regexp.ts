#!/usr/bin/env -S bun
import {parseArgs} from 'node:util'
import path from 'node:path'
import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
import {$} from 'bun'

type Token = any

type AllOrNone<T> =
    | Required<T>
    | { [K in keyof T]?: never }

type ParamType = string | number | boolean
type WildcardType = Iterable<ParamType>

type CompileOptions = {
    delimiter?: string
    encode?: string
    functionName?: string
}

class CodeWriter {
    private lines: string[] = []
    private indentLevel = 0

    line(text = ''): void {
        if (text === '') {
            this.lines.push('')
            return
        }
        const indent = '    '.repeat(this.indentLevel)
        this.lines.push(indent + text)
    }

    block(header: string, body: () => void): void {
        this.line(header + ' {')
        this.indentLevel++
        body()
        this.indentLevel--
        this.line('}')
    }

    indent(): void {
        this.indentLevel++
    }

    dedent(): void {
        this.indentLevel--
    }

    linesText(text: string): void {
        for (const line of text.split('\n')) {
            this.line(line)
        }
    }

    toString(): string {
        return this.lines.join('\n')
    }
}

function escapeString(value: string): string {
    return JSON.stringify(value)
}

function loadPathToRegexpParse(): (pattern: string) => { tokens: Token[] } {
    const localRequire = createRequire(import.meta.url)
    try {
        return localRequire('path-to-regexp').parse
    } catch {
        // This repo sometimes installs deps under `.tmp/node_modules` instead of `node_modules`.
        const repoRoot = path.resolve(import.meta.dir, '../../../..')
        const tmpRequire = createRequire(path.join(repoRoot, '.tmp', 'dist', 'bundle.cjs'))
        return tmpRequire('path-to-regexp').parse
    }
}

function compile(pattern: string, {delimiter = '/', encode = 'encodeURIComponent', functionName = 'generate'}: CompileOptions = {}): string {
    const parse = loadPathToRegexpParse()
    const {tokens} = parse(pattern)

    type Prop = { name: string; type: string }

    const baseProps: Prop[] = []
    const groupTypes: string[] = []

    const typeOfParam = (t: any) => (t.type === 'wildcard' ? 'WildcardType' : 'ParamType')
    const makeProp = (name: string, t: any): Prop => ({name, type: typeOfParam(t)})

    function collectGroupProps(ts: any[]): Prop[] {
        const props: Prop[] = []
        for (const t of ts) {
            if (t.type === 'param' || t.type === 'wildcard') props.push(makeProp(t.name, t))
            else if (t.type === 'group') props.push(...collectGroupProps(t.tokens))
        }
        return props
    }

    function collectTypes(ts: any[], intoBase = true) {
        for (const t of ts) {
            if ((t.type === 'param' || t.type === 'wildcard') && intoBase) {
                baseProps.push(makeProp(t.name, t))
            } else if (t.type === 'group') {
                const groupProps = collectGroupProps(t.tokens)
                if (groupProps.length) {
                    const some = [
                        '{',
                        ...groupProps.map(p => `    ${escapeString(p.name)}: ${p.type}`),
                        '}',
                    ].join('\n')
                    groupTypes.push(`AllOrNone<${some}>`)
                }
                collectTypes(t.tokens, false)
            }
        }
    }

    collectTypes(tokens)

    const baseParamsType = [
        '{',
        ...baseProps.map(p => `    ${escapeString(p.name)}: ${p.type}`),
        '}',
    ].join('\n')
    const paramsType = groupTypes.length ? `${baseParamsType} & ${groupTypes.join(' & ')}` : baseParamsType

    const out = new CodeWriter()
    out.line(`export function ${functionName}(`)
    out.indent()
    out.linesText(`params: ${paramsType}`)
    out.dedent()
    out.line(`): string {`)
    out.indent()

    out.line(`let sb = ""`)
    out.line(``)

    const delim = escapeString(delimiter)

    function collectNames(ts2: any[]): string[] {
        const names: string[] = []
        for (const t of ts2) {
            if (t.type === 'param' || t.type === 'wildcard') names.push(t.name)
            else if (t.type === 'group') names.push(...collectNames(t.tokens))
        }
        return names
    }

    function emitTokens(ts2: any[], optional = false): void {
        if (!optional) {
            for (const t of ts2) {
                if (t.type === 'param' || t.type === 'wildcard') {
                    out.line(
                        `if (params[${escapeString(t.name)}] == null) throw new Error(${escapeString(`Missing param: ${t.name}`)})`,
                    )
                }
            }
        }

        for (const t of ts2) {
            if (t.type === 'text') {
                out.line(`sb += ${escapeString(t.value)}`)
            } else if (t.type === 'param') {
                out.line(`sb += ${encode}(params[${escapeString(t.name)}])`)
            } else if (t.type === 'wildcard') {
                out.line(`sb += Array.from(params[${escapeString(t.name)}], ${encode}).join(${delim})`)
            } else if (t.type === 'group') {
                const names = collectNames(t.tokens).map(name => escapeString(name))
                if (!names.length) continue
                const all = names.map(n => `params[${n}] != null`).join(' && ')
                const none = names.map(n => `params[${n}] == null`).join(' && ')
                const list = names.join(', ')

                out.line(`if (${all}) {`)
                out.indent()
                emitTokens(t.tokens, true)
                out.dedent()
                out.line(`} else if (!(${none})) {`)
                out.indent()
                out.line(`throw new Error(${escapeString(`Group requires all-or-none: ${list}`)})`)
                out.dedent()
                out.line(`}`)
            }
        }
    }

    emitTokens(tokens)
    out.line(``)
    out.line(`return sb`)

    out.dedent()
    out.line(`}`)

    return out.toString()
}

async function main(argv: string[] = Bun.argv): Promise<void> {
    const {positionals, values} = parseArgs({
        args: argv,
        allowPositionals: true,
        strict: true,
        options: {
            output: {type: 'string', short: 'o'},
            delimiter: {type: 'string'},
            encode: {type: 'string'},
            'function-name': {type: 'string'},
        },
    })

    const [, , patternArg] = positionals
    const pattern = patternArg ?? `/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}`
    const outputPath =
        (values.output as string | undefined)
        ?? path.resolve(import.meta.dir, '..', 'path-to-regexp.gen.ts')

    const commandText = ['bun', ...argv.slice(1).map(arg => $.escape(arg))].join(' ')

    const lines: string[] = []
    lines.push(`// Do not modify this file. It was auto-generated with the following command:`)
    lines.push(`// $ ${commandText}`)
    lines.push(``)
    lines.push(`type AllOrNone<T> =`)
    lines.push(`    | Required<T>`)
    lines.push(`    | { [K in keyof T]?: never }`)
    lines.push(``)
    lines.push(`type ParamType = string | number | boolean`)
    lines.push(`type WildcardType = Iterable<ParamType>`)
    lines.push(``)

    const compileOptions: CompileOptions = {
        functionName: (values['function-name'] as string | undefined) ?? 'generate',
    }
    if (values.delimiter != null) compileOptions.delimiter = values.delimiter as string
    if (values.encode != null) compileOptions.encode = values.encode as string

    const code = compile(pattern, compileOptions)

    lines.push(code)
    lines.push(``)

    await fs.writeFile(outputPath, lines.join('\n'), 'utf8')
    console.log(`Wrote ${outputPath}`)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
