#!/usr/bin/env -S bun
import fs from 'node:fs/promises'
import path from 'node:path'
import {parseArgs} from 'node:util'
import * as ts from 'typescript'
import {$} from 'bun'
import {parse} from 'path-to-regexp'

type CompileOptions = {
    delimiter?: string
    encode?: string
    functionName?: string
}

function escapeString(value: string): string {
    return JSON.stringify(value)
}

function compilePathGenerator(
    pattern: string,
    {delimiter = '/', encode = 'encodeURIComponent', functionName = 'generate'}: CompileOptions = {},
): string {
    const {tokens} = parse(pattern)

    type Prop = { name: string; type: string }

    const baseProps: Prop[] = []
    const groupTypes: string[] = []

    const typeOfParam = (t: any) => (t.type === 'wildcard' ? '__WildcardType' : '__ParamType')
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
                    groupTypes.push(`__AllOrNone<${some}>`)
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
    const indentUnit = '    '
    const line = (indentLevel: number, text = ''): void => {
        if (text === '') lines.push('')
        else lines.push(indentUnit.repeat(indentLevel) + text)
    }
    const hasAnyParams = baseProps.length > 0 || groupTypes.length > 0

    if (hasAnyParams) {
        lines.push(`export function ${functionName}(`)
        lines.push(`    params: ${paramsType}`)
        lines.push(`): string {`)
    } else {
        lines.push(`export function ${functionName}(): string {`)
    }
    line(1, `let sb = ""`)
    line(0)

    const delim = escapeString(delimiter)

    function collectNames(ts2: any[]): string[] {
        const names: string[] = []
        for (const t of ts2) {
            if (t.type === 'param' || t.type === 'wildcard') names.push(t.name)
            else if (t.type === 'group') names.push(...collectNames(t.tokens))
        }
        return names
    }

    function emitTokens(ts2: any[], indentLevel: number, optional = false): void {
        if (!optional && hasAnyParams) {
            for (const t of ts2) {
                if (t.type === 'param' || t.type === 'wildcard') {
                    line(
                        indentLevel,
                        `if (params[${escapeString(t.name)}] == null) throw new Error(${escapeString(`Missing param: ${t.name}`)})`,
                    )
                }
            }
        }

        for (const t of ts2) {
            if (t.type === 'text') {
                line(indentLevel, `sb += ${escapeString(t.value)}`)
            } else if (t.type === 'param') {
                line(indentLevel, `sb += (${encode})(String(params[${escapeString(t.name)}]))`)
            } else if (t.type === 'wildcard') {
                line(
                    indentLevel,
                    `sb += Array.from(params[${escapeString(t.name)}], v => (${encode})(String(v))).join(${delim})`,
                )
            } else if (t.type === 'group') {
                const names = collectNames(t.tokens).map(name => escapeString(name))
                if (!names.length) continue
                const all = names.map(n => `params[${n}] != null`).join(' && ')
                const none = names.map(n => `params[${n}] == null`).join(' && ')
                const list = names.join(', ')

                line(indentLevel, `if (${all}) {`)
                emitTokens(t.tokens, indentLevel + 1, true)
                line(indentLevel, `} else if (!(${none})) {`)
                line(indentLevel + 1, `throw new Error(${escapeString(`Group requires all-or-none: ${list}`)})`)
                line(indentLevel, `}`)
            }
        }
    }

    emitTokens(tokens, 1)
    line(0)
    line(1, `return sb`)
    lines.push(`}`)
    return lines.join('\n')
}

function isStringLike(expr: ts.Expression): expr is ts.StringLiteralLike | ts.NoSubstitutionTemplateLiteral {
    return ts.isStringLiteralLike(expr) || ts.isNoSubstitutionTemplateLiteral(expr)
}

function toRouteFunctionName(routeName: string): string {
    const ident = routeName
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^[^a-zA-Z_]+/, '')
    return ident || 'route'
}

type ExtractedRoute = { name: string; pattern: string }

function getProp(object: ts.ObjectLiteralExpression, propName: string): ts.Expression | undefined {
    for (const prop of object.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === propName) {
            return prop.initializer
        }
    }
    return undefined
}

function resolveDefaultExportExpression(sourceFile: ts.SourceFile): ts.Expression | undefined {
    for (const stmt of sourceFile.statements) {
        if (!ts.isExportAssignment(stmt)) continue
        if (stmt.isExportEquals) continue
        return stmt.expression
    }
    return undefined
}

function findVariableInitializer(sourceFile: ts.SourceFile, name: string): ts.Expression | undefined {
    for (const stmt of sourceFile.statements) {
        if (!ts.isVariableStatement(stmt)) continue
        for (const decl of stmt.declarationList.declarations) {
            if (!ts.isIdentifier(decl.name) || decl.name.text !== name) continue
            return decl.initializer
        }
    }
    return undefined
}

function extractRoutesFromDefaultExport(sourceFile: ts.SourceFile): ExtractedRoute[] {
    const defaultExpr = resolveDefaultExportExpression(sourceFile)
    if (!defaultExpr) return []

    const rootExpr = ts.isIdentifier(defaultExpr)
        ? findVariableInitializer(sourceFile, defaultExpr.text) ?? defaultExpr
        : defaultExpr

    if (!ts.isArrayLiteralExpression(rootExpr)) return []

    const routes: ExtractedRoute[] = []

    for (const element of rootExpr.elements) {
        if (ts.isObjectLiteralExpression(element)) {
            const nameExpr = getProp(element, 'name')
            const patternExpr = getProp(element, 'pattern')
            if (!nameExpr || !patternExpr) continue
            if (!isStringLike(nameExpr) || !isStringLike(patternExpr)) continue
            routes.push({name: nameExpr.text, pattern: patternExpr.text})
        } else if (ts.isArrayLiteralExpression(element)) {
            const [nameExpr, patternExpr] = element.elements
            if (!nameExpr || !patternExpr) continue
            if (!isStringLike(nameExpr) || !isStringLike(patternExpr)) continue
            routes.push({name: nameExpr.text, pattern: patternExpr.text})
        }
    }

    return routes
}

async function main(argv: string[] = Bun.argv): Promise<void> {
    const {positionals, values} = parseArgs({
        args: argv,
        allowPositionals: true,
        strict: true,
        options: {
            output: {type: 'string', short: 'o'},
            'wildcard-delimiter': {type: 'string'},
            'encode-function': {type: 'string'},
        },
    })

    const [, , routesPathArg] = positionals
    if (!routesPathArg) {
        console.error(
            'Usage: bun src/bin/gen-routes.ts <routes-file> [-o <output-file>] [--wildcard-delimiter <string>] [--encode-function <identifier>]',
        )
        process.exit(1)
    }

    const routesPath = path.resolve(process.cwd(), routesPathArg)
    const outputPath =
        (values.output as string | undefined)
        ? path.resolve(process.cwd(), values.output as string)
        : path.join(path.dirname(routesPath), 'routes.gen.ts')

    const codeText = await fs.readFile(routesPath, 'utf8')
    const sourceFile = ts.createSourceFile(routesPath, codeText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

    const routes = extractRoutesFromDefaultExport(sourceFile)
        .map(r => ({...r, pattern: r.pattern.trim()}))
        .filter(r => r.pattern.startsWith('/') && r.pattern !== '*')

    const wildcardDelimiter = (values['wildcard-delimiter'] as string | undefined) ?? '/'
    const encodeFunction = (values['encode-function'] as string | undefined) ?? 'encodeURIComponent'

    const rawArgs = argv.slice(1)
    if (rawArgs[0] && path.isAbsolute(rawArgs[0])) {
        rawArgs[0] = path.relative(process.cwd(), rawArgs[0]).replace(/\\/g, '/')
    }
    const commandText = ['bun', ...rawArgs.map(arg => $.escape(arg))].join(' ')

    const out: string[] = []
    out.push(`// Do not modify this file. It was auto-generated with the following command:`)
    out.push(`// $ ${commandText}`)
    out.push(``)
    out.push(`type __AllOrNone<T> =`)
    out.push(`    | Required<T>`)
    out.push(`    | { [K in keyof T]?: never }`)
    out.push(``)
    out.push(`type __ParamType = string | number | boolean`)
    out.push(`type __WildcardType = Iterable<__ParamType>`)
    out.push(``)

    if (!routes.length) {
        out.push(`// No string route patterns found in the default export.`)
        out.push(``)
    } else {
        const usedNames = new Set<string>()
        for (const route of routes) {
            const base = toRouteFunctionName(route.name)
            let name = base
            let i = 2
            while (usedNames.has(name)) {
                name = `${base}_${i++}`
            }
            usedNames.add(name)

            out.push(compilePathGenerator(route.pattern, {functionName: name, delimiter: wildcardDelimiter, encode: encodeFunction}))
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
