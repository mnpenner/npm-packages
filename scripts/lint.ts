#!/usr/bin/env -S bun -i
import { $ } from 'bun'
import { resolvePackagePathTargets } from './lib/package-dirs'
import { sh } from './lib/shell-exec.ts'
import { relative, resolve } from 'node:path'

function resolveScript(path: string) {
    return relative(process.cwd(), resolve(__dirname, path)).replaceAll('\\', '/')
}

async function main(args: string[]): Promise<number | void> {
    const targets = await resolvePackagePathTargets(args.length > 0 ? args : ['.'])
    const formatter = resolveScript('lib/eslint-relative-formatter.ts')

    await sh`bun run --bun eslint --format ${formatter} ${targets}`
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
