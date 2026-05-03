#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import { applyEdits, modify, parse, type ParseError } from 'jsonc-parser'
import fg from 'fast-glob'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path/posix'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

async function main(_options: Options, _positionals: Positionals): Promise<number | void> {
    const tsconfigPath = 'tsconfig.json'
    let tsconfigText = readFileSync(tsconfigPath, 'utf8')

    const parseErrors: ParseError[] = []
    parse(tsconfigText, parseErrors)
    if (parseErrors.length > 0) {
        throw new Error(
            `Unable to parse ${tsconfigPath}: ${parseErrors.length} JSONC parse error(s)`,
        )
    }

    const formattingOptions = {
        // insertSpaces: true,
        // tabSize: 2,
    }

    const tsdownConfigPaths = await fg('packages/*/tsdown.config.ts')
    const pathAliases = new Map<string, string[]>()

    const packagePathAliases = await Promise.all(
        tsdownConfigPaths.map((tsdownConfigPath) => readTsdownPathAliases(tsdownConfigPath)),
    )

    for (const packageAliases of packagePathAliases) {
        for (const [alias, entryPaths] of packageAliases) {
            pathAliases.set(alias, entryPaths)
        }
    }

    for (const [alias, entryPaths] of pathAliases) {
        tsconfigText = applyEdits(
            tsconfigText,
            modify(tsconfigText, ['compilerOptions', 'paths', alias], entryPaths, {
                formattingOptions,
            }),
        )
    }

    writeFileSync(tsconfigPath, tsconfigText)

    return 0
}

async function readTsdownPathAliases(tsdownConfigPath: string): Promise<Map<string, string[]>> {
    const packageDirectory = dirname(tsdownConfigPath)
    const packageJsonPath = join(packageDirectory, 'package.json')
    const packageName = readPackageName(packageJsonPath)
    const entry = await readTsdownEntry(tsdownConfigPath)

    return resolvePathAliases(packageName, packageDirectory, entry, tsdownConfigPath)
}

function readPackageName(packageJsonPath: string): string {
    let packageJson: unknown

    try {
        packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    } catch (error) {
        throw new Error(`Unable to read ${packageJsonPath}: ${formatError(error)}`, {
            cause: error,
        })
    }

    if (
        !isRecord(packageJson) ||
        typeof packageJson.name !== 'string' ||
        packageJson.name.length === 0
    ) {
        throw new Error(`Expected ${packageJsonPath} to contain a non-empty string "name" field`)
    }

    return packageJson.name
}

async function readTsdownEntry(tsdownConfigPath: string): Promise<unknown> {
    try {
        const configModule = await import(tsdownConfigPath)
        return configModule.default?.entry
    } catch (error) {
        throw new Error(`Unable to import ${tsdownConfigPath}: ${formatError(error)}`, {
            cause: error,
        })
    }
}

function resolvePathAliases(
    packageName: string,
    packageDirectory: string,
    entry: unknown,
    tsdownConfigPath: string,
): Map<string, string[]> {
    const aliases = new Map<string, string[]>()

    if (isEntryValue(entry)) {
        assertEntryValue(entry, tsdownConfigPath)
        aliases.set(packageName, resolveEntryPaths(packageDirectory, entry))
        return aliases
    }

    if (!isRecord(entry)) {
        throw new Error(
            `Expected ${tsdownConfigPath} entry to be a string, string array, or entry map`,
        )
    }

    const entries = Object.entries(entry)
    if (entries.length === 0) {
        throw new Error(`Expected ${tsdownConfigPath} entry map to contain at least one entry`)
    }

    if (entries.length === 1) {
        const [entryName, entryValue] = entries[0]!
        assertLiteralEntryPath(entryName, tsdownConfigPath)
        assertEntryValue(entryValue, tsdownConfigPath)
        aliases.set(packageName, resolveEntryPaths(packageDirectory, entryValue))
        return aliases
    }

    for (const [entryName, entryValue] of entries) {
        assertLiteralEntryPath(entryName, tsdownConfigPath)
        assertEntryValue(entryValue, tsdownConfigPath)
        const alias = entryName === 'index' ? packageName : `${packageName}/${entryName}`
        aliases.set(alias, resolveEntryPaths(packageDirectory, entryValue))
    }

    return aliases
}

function resolveEntryPaths(packageDirectory: string, entryValue: string | string[]): string[] {
    const entries = Array.isArray(entryValue) ? entryValue : [entryValue]

    return entries.map((entryPath) => relative('.', join(packageDirectory, entryPath)))
}

function assertEntryValue(
    value: unknown,
    tsdownConfigPath: string,
): asserts value is string | string[] {
    if (!isEntryValue(value)) {
        throw new Error(
            `Expected every ${tsdownConfigPath} entry value to be a string or string array`,
        )
    }

    for (const entryPath of Array.isArray(value) ? value : [value]) {
        assertLiteralEntryPath(entryPath, tsdownConfigPath)
    }
}

// tsdown supports glob and negation entries, but this script maps only literal entry paths.
// Reference: https://tsdown.dev/options/entry
function assertLiteralEntryPath(entryPath: string, tsdownConfigPath: string): void {
    if (entryPath.startsWith('!')) {
        throw new Error(
            `Unsupported negation entry "${entryPath}" in ${tsdownConfigPath}. See https://tsdown.dev/options/entry`,
        )
    }

    if (/[*?[\]{}]/u.test(entryPath)) {
        throw new Error(
            `Unsupported glob entry "${entryPath}" in ${tsdownConfigPath}. See https://tsdown.dev/options/entry`,
        )
    }
}

function isEntryValue(value: unknown): value is string | string[] {
    return (
        typeof value === 'string' ||
        (Array.isArray(value) &&
            value.length > 0 &&
            value.every((entry) => typeof entry === 'string'))
    )
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error ?? 'unknown error')
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
