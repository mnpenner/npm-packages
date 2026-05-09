#!/usr/bin/env -S bun -i
import { readdir, readFile, stat } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import chalk from 'chalk'
import { parse } from 'jsonc-parser'
import { resolvePackageDirName } from './lib/package-dirs'

const PARSE_CONFIG = {
    options: {
        bail: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

const IGNORED_DIRS = new Set([
    '.git',
    '.hg',
    '.idea',
    'coverage',
    'dist',
    'docs',
    'node_modules',
    'scratch',
])

type TsConfig = {
    references?: Array<{ path?: string }>
}

function isProjectConfig(filename: string): boolean {
    return /^tsconfig(?:\.[^.]+)?\.json$/.test(filename) && filename !== 'tsconfig.base.json'
}

async function pathExists(path: string): Promise<boolean> {
    try {
        await stat(path)
        return true
    } catch {
        return false
    }
}

async function readReferences(configPath: string): Promise<string[]> {
    const config = parse(await readFile(configPath, 'utf-8')) as TsConfig
    const configDir = resolve(configPath, '..')
    const references: string[] = []

    for (const ref of config.references ?? []) {
        if (!ref.path) continue

        const refPath = resolve(configDir, ref.path)
        if (!(await pathExists(refPath))) continue

        const refStats = await stat(refPath)
        references.push(refStats.isDirectory() ? join(refPath, 'tsconfig.json') : refPath)
    }

    return references
}

async function findTsConfigsInDir(dir: string): Promise<string[]> {
    const configs: string[] = []

    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name)
        if (entry.isFile() && isProjectConfig(entry.name)) {
            configs.push(fullPath)
            continue
        }
        if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name)) continue

        configs.push(...(await findTsConfigsInDir(fullPath)))
    }

    return configs
}

async function findTsConfigs(target: string): Promise<string[]> {
    const packageDirName = await resolvePackageDirName(target)
    if (packageDirName) return findTsConfigsInDir(resolve('packages', packageDirName))

    const directPath = isAbsolute(target) ? target : resolve(target)

    if (await pathExists(directPath)) {
        const targetStats = await stat(directPath)
        if (targetStats.isDirectory()) return findTsConfigsInDir(directPath)
        if (isProjectConfig(target)) return [directPath]
    }

    return []
}

type TypecheckFailure = {
    configPath: string
    exitCode: number
}

async function runTsc(configPath: string, seen: Set<string>, failures: TypecheckFailure[]) {
    const resolvedConfigPath = resolve(configPath)
    if (seen.has(resolvedConfigPath)) return
    seen.add(resolvedConfigPath)

    const label = relative(process.cwd(), resolvedConfigPath) || 'root'
    console.log(chalk.blue(`Typechecking ${label}...`))

    const result = await $`bun run tsc --noEmit -p ${resolvedConfigPath}`.nothrow()
    if (result.exitCode !== 0) {
        console.error(chalk.red(`Typecheck failed for ${label}`))
        failures.push({ configPath: resolvedConfigPath, exitCode: result.exitCode })
        return
    }

    console.log(chalk.green(`Typecheck passed for ${label}: no errors`))

    for (const referencePath of await readReferences(resolvedConfigPath)) {
        await runTsc(referencePath, seen, failures)
    }
}

function printFailureSummary(failures: readonly TypecheckFailure[]) {
    if (!failures.length) return

    console.error(chalk.red(`\nTypecheck failed for ${failures.length} project(s):`))
    for (const failure of failures) {
        console.error(`  - ${relative(process.cwd(), failure.configPath)}`)
    }
}

async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const seen = new Set<string>()
    const failures: TypecheckFailure[] = []
    const targets = positionals.length ? positionals : ['.']

    for (const target of targets) {
        const configPaths = await findTsConfigs(target)
        if (!configPaths.length) {
            console.error(chalk.red(`Error: Could not find tsconfig.json for "${target}"`))
            return 1
        }

        for (const configPath of configPaths) {
            await runTsc(configPath, seen, failures)
            if (options.bail && failures.length) {
                printFailureSummary(failures)
                return failures[0]!.exitCode
            }
        }
    }

    if (failures.length) {
        printFailureSummary(failures)
        return 1
    }
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig['values']
type Positionals = ParsedConfig['positionals']

if (import.meta.main) {
    const { values, positionals } = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
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
