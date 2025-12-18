#!/usr/bin/env -S bun
import fs from 'node:fs/promises'
import path from 'node:path'
import {parseArgs} from 'node:util'
import * as ts from 'typescript'
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

function escapeString(value: string): string {
    return JSON.stringify(value)
}

function loadPathToRegexpParse(): (pattern: string) => { tokens: Token[] } {
    const localRequire = createRequire(import.meta.url)
    try {
        return localRequire('path-to-regexp').parse
    } catch {
        const repoRoot = path.resolve(import.meta.dir, '../../../..')
        const tmpRequire = createRequire(path.join(repoRoot, '.tmp', 'dist', 'bundle.cjs'))
        return tmpRequire('path-to-regexp').parse
    }
}

function compilePathGenerator(
    pattern: string,
    {delimiter = '/', encode = 'encodeURIComponent', functionName = 'generate'}: CompileOptions = {},
): string {
    const parse = loadPathToRegexpParse()
    const {tokens} = parse(pattern)

    type Prop = { name: string; type: string }

    const baseProps: Prop[] = []
    const groupTypes: string[] = []

    const typeOfParam = (t: any) => (t.type === 'wildcard' ? 'WildcardType' : 'ParamType')
    const makeProp = (name: string, t: any): Prop => ({name, type: typeOfParam(t)})

    function collectGroupProps(ts2: any[]): Prop[] {
        const props: Prop[] = []
        for (const t of ts2) {
            if (t.type === 'param' || t.type === 'wildcard') props.push(makeProp(t.name, t))
            else if (t.type === 'group') props.push(...collectGroupProps(t.tokens))
        }
        return props
    }

    function collectTypes(ts2: any[], intoBase = true) {
        for (const t of ts2) {
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

    const lines: string[] = []
    lines.push(`export function ${functionName}(`)
    lines.push(`    params: ${paramsType}`)
    lines.push(`): string {`)
    lines.push(`    let sb = ""`)
    lines.push(``)

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
                    lines.push(
                        `    if (params[${escapeString(t.name)}] == null) throw new Error(${escapeString(`Missing param: ${t.name}`)})`,
                    )
                }
            }
        }

        for (const t of ts2) {
            if (t.type === 'text') {
                lines.push(`    sb += ${escapeString(t.value)}`)
            } else if (t.type === 'param') {
                lines.push(`    sb += ${encode}(params[${escapeString(t.name)}])`)
            } else if (t.type === 'wildcard') {
                lines.push(`    sb += Array.from(params[${escapeString(t.name)}], ${encode}).join(${delim})`)
            } else if (t.type === 'group') {
                const names = collectNames(t.tokens).map(name => escapeString(name))
                if (!names.length) continue
                const all = names.map(n => `params[${n}] != null`).join(' && ')
                const none = names.map(n => `params[${n}] == null`).join(' && ')
                const list = names.join(', ')

                lines.push(`    if (${all}) {`)
                emitTokens(t.tokens, true)
                lines.push(`    } else if (!(${none})) {`)
                lines.push(`        throw new Error(${escapeString(`Group requires all-or-none: ${list}`)})`)
                lines.push(`    }`)
            }
        }
    }

    emitTokens(tokens)
    lines.push(``)
    lines.push(`    return sb`)
    lines.push(`}`)
    return lines.join('\n')
}

function isStringLike(expr: ts.Expression): expr is ts.StringLiteralLike | ts.NoSubstitutionTemplateLiteral {
    return ts.isStringLiteralLike(expr) || ts.isNoSubstitutionTemplateLiteral(expr)
}

function toRouteFunctionName(pattern: string): string {
    if (pattern === '/') return 'route_root'
    const cleaned = pattern
        .replace(/^\//, '')
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '')

    const parts = cleaned.split('/').filter(Boolean)
    const words: string[] = []
    for (const part of parts) {
        if (part === '*') continue
        if (part.startsWith(':')) words.push(part.slice(1))
        else words.push(part)
    }
    const raw = words.join('_') || 'route'
    const ident = raw.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z_]+/, '')
    return `route_${ident || 'route'}`
}

function extractRoutesPatterns(sourceFile: ts.SourceFile): string[] {
    const patterns: string[] = []

    const visit = (node: ts.Node): void => {
        if (ts.isVariableStatement(node)) {
            const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false
            if (!isExported) return

            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name) || decl.name.text !== 'ROUTES') continue
                const init = decl.initializer
                if (!init || !ts.isArrayLiteralExpression(init)) continue

                for (const element of init.elements) {
                    if (!ts.isArrayLiteralExpression(element) || element.elements.length < 1) continue
                    const pattExpr = element.elements[0]
                    if (!pattExpr || !isStringLike(pattExpr)) continue
                    patterns.push(pattExpr.text)
                }
            }
        }

        ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return patterns
}

async function main(argv: string[] = Bun.argv): Promise<void> {
    const {positionals, values} = parseArgs({
        args: argv,
        allowPositionals: true,
        strict: true,
        options: {
            output: {type: 'string', short: 'o'},
        },
    })

    const [, , routesPathArg] = positionals
    if (!routesPathArg) {
        console.error('Usage: bun src/bin/gen-routes.ts <routes-file> [-o <output-file>]')
        process.exit(1)
    }

    const routesPath = path.resolve(process.cwd(), routesPathArg)
    const outputPath =
        (values.output as string | undefined)
        ? path.resolve(process.cwd(), values.output as string)
        : path.join(path.dirname(routesPath), 'routes.gen.ts')

    const codeText = await fs.readFile(routesPath, 'utf8')
    const sourceFile = ts.createSourceFile(routesPath, codeText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    const patterns = extractRoutesPatterns(sourceFile)
        .map(p => p.trim())
        .filter(p => p.startsWith('/') && p !== '*')

    const commandText = ['bun', ...argv.slice(1).map(arg => $.escape(arg))].join(' ')

    const out: string[] = []
    out.push(`// Do not modify this file. It was auto-generated with the following command:`)
    out.push(`// $ ${commandText}`)
    out.push(``)
    out.push(`type AllOrNone<T> =`)
    out.push(`    | Required<T>`)
    out.push(`    | { [K in keyof T]?: never }`)
    out.push(``)
    out.push(`type ParamType = string | number | boolean`)
    out.push(`type WildcardType = Iterable<ParamType>`)
    out.push(``)

    if (!patterns.length) {
        out.push(`// No string route patterns found.`)
        out.push(``)
    } else {
        for (const pattern of patterns) {
            const fn = toRouteFunctionName(pattern)
            out.push(compilePathGenerator(pattern, {functionName: fn}))
            out.push(``)
        }
    }

    await fs.writeFile(outputPath, out.join('\n'), 'utf8')
    console.log(`Wrote ${outputPath}`)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})

