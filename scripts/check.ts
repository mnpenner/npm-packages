#!/usr/bin/env -S bun -i
import { join, resolve, relative, sep } from 'node:path'
import { $ } from 'bun'
import chalk from 'chalk'
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { readPackageDirNames, readPackageNameDirMap } from './lib/package-dirs'

const PARSE_CONFIG = {
    options: {
        fix: {
            type: 'boolean',
            default: false,
        },
    },
    strict: false,
    allowPositionals: true,
} satisfies ParseArgsConfig

function enableChildProcessColors(): void {
    if (process.env.FORCE_COLOR !== undefined || process.env.NO_COLOR !== undefined) {
        return
    }

    if (chalk.level > 0) {
        process.env.FORCE_COLOR = String(chalk.level)
    }
}

/**
 * Runs test, lint, and typecheck for the entire repo or specific packages/paths.
 */
async function main(options: Options, positionals: Positionals): Promise<number | void> {
    enableChildProcessColors()

    const fix = options.fix === true
    const packagesDir = 'packages'
    const packageDirs = await readPackageDirNames()
    const packageNamesMap = await readPackageNameDirMap()

    if (positionals.length === 0) {
        console.log(
            `Running full check (test, lint${fix ? ' --fix' : ''}, typecheck, format${fix ? ' --write' : ''})...`,
        )

        if (fix) {
            let failed = false

            console.log('\n--- Linting ---')
            const lintRes = await $`bun run lint . --fix`.nothrow()
            if (lintRes.exitCode !== 0) failed = true

            console.log('\n--- Formatting ---')
            const formatRes = await $`bun run --bun prettier . --write`.nothrow()
            if (formatRes.exitCode !== 0) failed = true

            console.log('\n--- Typechecking ---')
            const typeRes = await $`bun run typecheck`.nothrow()
            if (typeRes.exitCode !== 0) failed = true

            console.log('\n--- Testing ---')
            const testRes = await $`bun run test:unit`.nothrow()
            if (testRes.exitCode !== 0) failed = true

            return failed ? 1 : 0
        }

        // Run in parallel for full check to match existing behavior of 'bun run check'
        const testPromise = $`bun run test:unit`.nothrow()
        const lintPromise = $`bun run lint .`.nothrow()
        const typecheckPromise = $`bun run typecheck`.nothrow()
        const formatPromise = $`bun run check-format`.nothrow()

        const [testRes, lintRes, typeRes, formatRes] = await Promise.all([
            testPromise,
            lintPromise,
            typecheckPromise,
            formatPromise,
        ])

        if (
            testRes.exitCode !== 0 ||
            lintRes.exitCode !== 0 ||
            typeRes.exitCode !== 0 ||
            formatRes.exitCode !== 0
        ) {
            return 1
        }
        return 0
    }

    const targetPackages = new Set<string>()
    const lintTargets = new Set<string>()

    for (const arg of positionals) {
        let resolvedDir: string | undefined
        if (packageNamesMap.has(arg)) {
            resolvedDir = packageNamesMap.get(arg)
        } else if (packageDirs.includes(arg)) {
            resolvedDir = arg
        }

        if (resolvedDir) {
            targetPackages.add(resolvedDir)
            lintTargets.add(join(packagesDir, resolvedDir))
            continue
        }

        const absPath = resolve(arg)
        const relPath = relative(process.cwd(), absPath)

        // Check if it's inside packages/
        const parts = relPath.split(sep)
        if (parts[0] === 'packages' && parts[1] && packageDirs.includes(parts[1])) {
            targetPackages.add(parts[1])
        }

        lintTargets.add(arg)
    }

    const targetedDisplay =
        Array.from(targetPackages).join(', ') || (positionals.length > 0 ? 'targeted files' : 'all')
    console.log(`Checking: ${targetedDisplay}...`)

    let failed = false

    // Run sequentially for targeted checks to keep output clean and readable
    if (targetPackages.size > 0) {
        console.log('\n--- Testing ---')
        const testRes = await $`bun run test:unit ${Array.from(targetPackages)}`.nothrow()
        if (testRes.exitCode !== 0) failed = true
    }

    console.log('\n--- Linting ---')
    const lintRes = fix
        ? await $`bun run lint ${Array.from(lintTargets)} --fix`.nothrow()
        : await $`bun run lint ${Array.from(lintTargets)}`.nothrow()
    if (lintRes.exitCode !== 0) failed = true

    console.log('\n--- Formatting ---')
    const formatRes = fix
        ? await $`bun run --bun prettier ${Array.from(lintTargets)} --write`.nothrow()
        : await $`bun run --bun prettier ${Array.from(lintTargets)} --check`.nothrow()
    if (formatRes.exitCode !== 0) failed = true

    if (targetPackages.size > 0 || positionals.length > 0) {
        console.log('\n--- Typechecking ---')
        // We pass the same original positionals to typecheck as it has its own resolution logic,
        // but we prefer package names if we found them.
        const typecheckArgs = targetPackages.size > 0 ? Array.from(targetPackages) : positionals
        const typeRes = await $`bun run typecheck ${typecheckArgs}`.nothrow()
        if (typeRes.exitCode !== 0) failed = true
    }

    if (failed) {
        console.log(chalk.red('\nCheck failed.'))
        return 1
    } else {
        console.log(chalk.green('\nCheck passed.'))
        return 0
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
