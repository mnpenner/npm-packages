import {describe, expect, it} from 'bun:test'
import Path from 'path'
import {App, Command} from './interfaces'
import {executeAppResult} from './run'
import {ErrorStyle} from './utils'

function createMisconfiguredApp(): Parameters<typeof executeAppResult>[0] {
    return new App('hello')
        .meta({bin: 'cli-api'})
        .arg('first', {repeatable: true, required: true})
        .arg('second', {repeatable: true, required: true})
        .run(() => {}) as Parameters<typeof executeAppResult>[0]
}

describe(executeAppResult.name, () => {
    it('returns exit code 2 for unknown root commands', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .command(new Command('world'))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['bacon'])

        expect(result).toEqual({
            code: 2,
            error: "cli-api: unknown command 'bacon'",
            errorStyle: ErrorStyle.InvalidArg,
        })
    })

    it('returns exit code 2 for unknown nested commands', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .command(new Command('world')
                .command(new Command('greet')
                    .run(() => {})))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['world', 'bacon'])

        expect(result).toEqual({
            code: 2,
            error: "cli-api: unknown command 'bacon'",
            errorStyle: ErrorStyle.InvalidArg,
        })
    })

    it('returns exit code 2 for unknown options', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('name', {alias: 'n', required: true})
            .run(() => {})

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['-a'])

        expect(result).toEqual({
            code: 2,
            error: 'cli-api: option -a not recognized',
            errorStyle: ErrorStyle.InvalidArg,
        })
    })

    it('returns misconfiguration errors with the config prefix and style', async () => {
        const result = await executeAppResult(createMisconfiguredApp(), [])

        expect(result).toEqual({
            code: 254,
            error: 'Config Error: Only the last positional can be repeatable',
            errorStyle: ErrorStyle.Misconfig,
        })
    })

    it('validates misconfigured apps before handling help flags', async () => {
        const result = await executeAppResult(createMisconfiguredApp(), ['--help'])

        expect(result).toEqual({
            code: 254,
            error: 'Config Error: Only the last positional can be repeatable',
            errorStyle: ErrorStyle.Misconfig,
        })
    })

    it('returns internal errors with the internal style and exit code', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .run(() => {
                throw new Error('kaboom')
            })

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], [])

        expect(result.code).toBe(253)
        expect(result.errorStyle).toBe(ErrorStyle.Internal)
        expect(result.error).toContain('Error: kaboom')
    })

    it('renders the correct colors for each error style', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "process.env.FORCE_COLOR = '1'",
                    "import {ErrorStyle, printError} from './src/utils'",
                    "printError('invalid', ErrorStyle.InvalidArg)",
                    "printError('misconfig', ErrorStyle.Misconfig)",
                    "printError('internal', ErrorStyle.Internal)",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            env: {
                ...process.env,
                FORCE_COLOR: '1',
            },
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('\u001B[41m')
        expect(output).toContain('\u001B[45m')
        expect(output).toContain('\u001B[44m')
    })

    it('prints app author in root help output', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App, Command} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello')",
                    "  .meta({bin: 'cli-api', version: '1.0.0', author: 'Mark Penner', description: 'Example app'})",
                    "  .command(new Command('world'))",
                    "await executeAppResult(app, ['--help'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')
        expect(result.stdout.toString()).toContain('Author: Mark Penner')
    })
})
