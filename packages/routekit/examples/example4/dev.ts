#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig

class CommandError extends Error {
    constructor(
        readonly command: string[],
        readonly exitCode: number,
    ) {
        super(`${command.join(' ')} exited with code ${exitCode}.`)
    }
}

async function main(options: Options, positionals: Positionals): Promise<number | void> {
    await run([
        process.execPath,
        '../../src/bin/gen-api-client.ts',
        './server/router.ts',
        '-o',
        './client/router.gen.ts',
        '-p',
    ])
    await run([process.execPath, './server/server.ts'])
}

async function run(command: string[]): Promise<void> {
    const child = Bun.spawn(command, {
        cwd: __dirname,
        env: getChildEnv(),
        stderr: 'inherit',
        stdin: 'inherit',
        stdout: 'inherit',
    })
    const exitCode = await child.exited

    if (exitCode !== 0) {
        throw new CommandError(command, exitCode)
    }
}

function getChildEnv(): NodeJS.ProcessEnv {
    const columns = process.stdout.columns ?? process.stderr.columns ?? process.env.COLUMNS

    return {
        ...process.env,
        ...(columns == null ? {} : { COLUMNS: String(columns) }),
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
            if (err instanceof CommandError) {
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
