#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { parse } from 'path-to-regexp'
import { normalizeLegacyPathToRegexpSyntax, normalizeRoutes, type Route } from '../src/lib/routes'

const PARSE_CONFIG = {
    options: {
        output: { type: 'string', short: 'o' },
        write: { type: 'boolean', short: 'w' },
        pretty: { type: 'boolean', short: 'p' },
        'wildcard-delimiter': { type: 'string' },
        'encode-function': { type: 'string' },
    },
    allowPositionals: true,
    strict: true,
} satisfies ParseArgsConfig

type CompileOptions = {
    delimiter?: string
    encode?: string
    functionName?: string
}

type RunOptions = {
    cwd?: string
    commandName?: string
    commandArgs?: readonly string[]
}

type RunResult = {
    exitCode?: number
    stdout: string
    stderr: string
}

function escapeString(value: string): string {
    return JSON.stringify(value)
}

function shellEscape(arg: string): string {
    if (/^[a-z0-9/_.-]+$/i.test(arg)) return arg
    return `'${arg.replace(/'/g, "'\\''")}'`
}

function compilePathGenerator(
    pattern: string,
    {
        delimiter = '/',
        encode = 'encodeURIComponent',
        functionName = 'generate',
    }: CompileOptions = {},
): string {
    const { tokens } = parse(normalizeLegacyPathToRegexpSyntax(pattern))

    type Prop = { name: string; type: string }

    const baseProps: Prop[] = []
    const groupTypes: string[] = []

    const typeOfParam = (t: any) => (t.type === 'wildcard' ? 'WildcardType' : 'ParamType')
    const makeProp = (name: string, t: any): Prop => ({ name, type: typeOfParam(t) })
    const renderPropsType = (props: readonly Prop[]): string =>
        props.length
            ? `{ ${props.map((p) => `${escapeString(p.name)}: ${p.type}`).join('; ')} }`
            : '{}'

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
                    groupTypes.push(`AllOrNone<${renderPropsType(groupProps)}>`)
                }
                collectTypes(t.tokens, false)
            }
        }
    }

    collectTypes(tokens)

    const baseParamsType = renderPropsType(baseProps)
    const paramsType = groupTypes.length
        ? `${baseParamsType} & ${groupTypes.join(' & ')}`
        : baseParamsType

    const lines: string[] = []
    const indentUnit = '    '
    const line = (indentLevel: number, text = ''): void => {
        if (text === '') lines.push('')
        else lines.push(indentUnit.repeat(indentLevel) + text)
    }
    const hasAnyParams = baseProps.length > 0 || groupTypes.length > 0

    if (hasAnyParams) {
        lines.push(`export function ${functionName}(params: ${paramsType}): string {`)
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
                const names = collectNames(t.tokens).map((name) => escapeString(name))
                if (!names.length) continue
                const all = names.map((n) => `params[${n}] != null`).join(' && ')
                const none = names.map((n) => `params[${n}] == null`).join(' && ')
                const list = names.join(', ')

                line(indentLevel, `if (${all}) {`)
                emitTokens(t.tokens, indentLevel + 1, true)
                line(indentLevel, `} else if (!(${none})) {`)
                line(
                    indentLevel + 1,
                    `throw new Error(${escapeString(`Group requires all-or-none: ${list}`)})`,
                )
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

function toRouteFunctionName(routeName: string): string {
    const ident = routeName
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^[^a-zA-Z_]+/, '')
    return ident || 'route'
}

type ExtractedRoute = { name: string; path: string }

async function importRoutes(routesPath: string): Promise<readonly Route[]> {
    const mod = (await import(pathToFileURL(routesPath).href)) as { default?: unknown }
    if (!Array.isArray(mod.default)) {
        throw new Error('Routes file must default export an array of routes.')
    }
    return mod.default as readonly Route[]
}

async function formatWithPrettier(source: string, outputPath: string): Promise<string> {
    let prettier: typeof import('prettier')
    try {
        prettier = await import('prettier')
    } catch (cause) {
        throw new Error('The --pretty option requires prettier to be installed.', { cause })
    }

    const options = (await prettier.resolveConfig(outputPath)) ?? {}
    return prettier.format(source, { ...options, filepath: outputPath })
}

function extractRoutes(routes: readonly Route[]): ExtractedRoute[] {
    return normalizeRoutes(routes).flatMap((route) => {
        if (!route.name || typeof route.path !== 'string') return []
        return [{ name: route.name, path: route.path }]
    })
}

async function main(
    options: Options,
    positionals: Positionals,
    {
        cwd = process.cwd(),
        commandName = 'rerouter',
        commandArgs = process.argv.slice(2),
    }: RunOptions = {},
): Promise<RunResult> {
    const [routesPathArg] = positionals
    if (!routesPathArg) {
        return {
            exitCode: 1,
            stdout: '',
            stderr: 'Usage: rerouter <routes-file> [-o <output-file>] [-w] [-p|--pretty] [--wildcard-delimiter <string>] [--encode-function <identifier>]\n',
        }
    }

    const routesPath = path.resolve(cwd, routesPathArg)
    let outputPath: string | undefined
    if (options.output) {
        outputPath = path.resolve(cwd, options.output as string)
    } else if (options.write) {
        outputPath = path.join(
            path.dirname(routesPath),
            path.basename(routesPath, path.extname(routesPath)) + '.gen.ts',
        )
    }

    const routes = extractRoutes(await importRoutes(routesPath))
        .map((r) => ({ ...r, path: r.path.trim() }))
        .filter((r) => r.path.startsWith('/') && r.path !== '*')

    const wildcardDelimiter = (options['wildcard-delimiter'] as string | undefined) ?? '/'
    const encodeFunction =
        (options['encode-function'] as string | undefined) ?? 'encodeURIComponent'

    const commandText = [commandName, ...commandArgs.map(shellEscape)].join(' ')

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

    if (!routes.length) {
        out.push(`// No string route paths found in the default export.`)
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

            out.push(
                compilePathGenerator(route.path, {
                    functionName: name,
                    delimiter: wildcardDelimiter,
                    encode: encodeFunction,
                }),
            )
            out.push(``)
        }
    }

    let finalOutput = out.join('\n')
    if (outputPath) {
        if (options.pretty) {
            finalOutput = await formatWithPrettier(finalOutput, outputPath)
        }
        await fs.writeFile(outputPath, finalOutput, 'utf8')
        return { stdout: '', stderr: `Wrote ${path.relative(cwd, outputPath) || '.'}\n` }
    } else {
        return { stdout: finalOutput, stderr: '' }
    }
}

/**
 * Runs the rerouter CLI implementation without spawning a separate process.
 *
 * @param args - Command line arguments, excluding the binary name.
 * @param options - Runtime options used to resolve paths and render the command comment.
 * @returns Captured stdout, stderr, and an optional process exit code.
 *
 * @example
 * ```ts
 * const result = await runRerouterBin(['./routes.ts'])
 * process.stdout.write(result.stdout)
 * ```
 *
 * @internal
 */
export async function runRerouterBin(
    args: readonly string[],
    options: RunOptions = {},
): Promise<RunResult> {
    const { values, positionals } = parseArgs({ ...PARSE_CONFIG, args: [...args] })
    return main(values, positionals, { ...options, commandArgs: args })
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig['values']
type Positionals = ParsedConfig['positionals']

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runRerouterBin(process.argv.slice(2)).then(
        (result) => {
            if (result.stdout) process.stdout.write(result.stdout)
            if (result.stderr) process.stderr.write(result.stderr)
            if (typeof result.exitCode === 'number') process.exitCode = result.exitCode
        },
        (err) => {
            console.error(err ?? 'An unknown error occurred')
            process.exitCode = 1
        },
    )
}
//#endregion
