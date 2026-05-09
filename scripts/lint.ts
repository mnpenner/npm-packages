#!/usr/bin/env -S bun -i
import { $ } from 'bun'
import { resolvePackagePathTargets } from './lib/package-dirs'

async function main(args: string[]): Promise<number | void> {
    const targets = await resolvePackagePathTargets(args.length > 0 ? args : ['.'])

    await $`bun run --bun eslint --format ./scripts/eslint-relative-formatter.ts ${targets}`
}

//#region Invoke main
if (import.meta.main) {
    main(Bun.argv.slice(2)).then(
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
