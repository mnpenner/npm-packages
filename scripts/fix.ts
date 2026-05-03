#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import { shellQuoteArgs } from './lib/shell-quote'

type PackageJson = {
    scripts?: Record<string, string>
}

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const packageJson = (await Bun.file('package.json').json()) as PackageJson
    const scriptNames = Object.keys(packageJson.scripts ?? {})
        .filter((scriptName) => scriptName.startsWith('fix:'))
        .sort()

    if (scriptNames.length === 0) {
        console.error('No fix:* scripts found.')
        return 1
    }

    const commands = scriptNames.map((scriptName) => {
        console.log(['$', 'bun', 'run', scriptName, shellQuoteArgs(positionals)].join(' '))

        return {
            process: Bun.spawn([process.execPath, 'run', scriptName, ...positionals], {
                stderr: 'inherit',
                stdin: 'inherit',
                stdout: 'inherit',
            }),
            scriptName,
        }
    })

    const results = await Promise.all(
        commands.map(async (command) => ({
            exitCode: await command.process.exited,
            scriptName: command.scriptName,
        })),
    )

    const failure = results.find((result) => result.exitCode !== 0)

    if (failure) {
        console.error(`${failure.scriptName} exited with code ${failure.exitCode}`)
        return failure.exitCode
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
