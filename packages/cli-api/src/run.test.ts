import {describe, expect, it} from 'bun:test'
import Path from 'path'
import {App, Command} from './interfaces'
import {executeAppResult} from './run'
import {createError, ErrorCategory} from './utils'

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
            error: createError("cli-api: unknown command 'bacon'", ErrorCategory.InvalidArg),
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
            error: createError("cli-api: unknown command 'bacon'", ErrorCategory.InvalidArg),
        })
    })

    it('returns exit code 2 for unknown nested commands even when help is provided', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .command(new Command('world')
                .command(new Command('greet')
                    .run(() => {})))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['-h', 'world', 'bacon'])

        expect(result).toEqual({
            code: 2,
            error: createError("cli-api: unknown command 'bacon'", ErrorCategory.InvalidArg),
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
            error: createError('cli-api: option -a not recognized', ErrorCategory.InvalidArg),
        })
    })

    it('returns exit code 2 for unknown options even when help is provided', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .command(new Command('world')
                .opt('name', {alias: 'n', required: true})
                .run(() => {}))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['world', '-h', '-a'])

        expect(result).toEqual({
            code: 2,
            error: createError('cli-api: option -a not recognized', ErrorCategory.InvalidArg),
        })
    })

    it('returns misconfiguration errors with the config prefix and style', async () => {
        const result = await executeAppResult(createMisconfiguredApp(), [])

        expect(result).toEqual({
            code: 254,
            error: createError('Config Error: Only the last positional can be repeatable', ErrorCategory.Misconfig),
        })
    })

    it('validates misconfigured apps before handling help flags', async () => {
        const result = await executeAppResult(createMisconfiguredApp(), ['--help'])

        expect(result).toEqual({
            code: 254,
            error: createError('Config Error: Only the last positional can be repeatable', ErrorCategory.Misconfig),
        })
    })

    it('passes custom global options through to sub-command handlers', async () => {
        let captured: Record<string, unknown> | undefined
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .globalOpt('profile', {alias: 'p', required: true})
            .command(new Command('world')
                .run((args, opts) => {
                    void args
                    captured = opts
                }))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--profile', 'dev', 'world'])

        expect(result).toEqual({code: null})
        expect(captured).toMatchObject({profile: 'dev', color: 'auto'})
    })

    it('returns a misconfiguration error when a global option collides with a local option', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .globalOpt('profile', {alias: 'p'})
            .command(new Command('world')
                .opt('profile')
                .run(() => {}))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['world'])

        expect(result).toEqual({
            code: 254,
            error: createError('Config Error: Option token `--profile` collides with `--profile`', ErrorCategory.Misconfig),
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
        expect(result.error?.type).toBe(ErrorCategory.Internal)
        expect(result.error?.message).toContain('Error: kaboom')
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

        const output = result.stdout.toString()
        expect(output).toContain('hello ver. 1.0.0 by Mark Penner')
        expect(output).toContain('hello ver. 1.0.0 by Mark Penner\n\nExample app')
    })

    it('prints app name, version, and description for executable root app help', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello')",
                    "  .meta({bin: 'cli-api', version: '1.0.0', description: 'Example app'})",
                    "  .opt('name', {required: true})",
                    "  .run(() => {})",
                    "await executeAppResult(app, ['--help'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('Example app')
        expect(output).toContain('Usage:')
        expect(output).toContain('--name=NAME')
        expect(output).toContain('Global Options:')
    })

    it('runs the sub-command example help without module export errors', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                'examples/sub-commands.ts',
                '-h',
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('hello ver. 0.2.0 by Mark Penner')
        expect(output).toContain('hello ver. 0.2.0 by Mark Penner\n\nExample app')
        expect(output).toContain('Example app')
    })

    it('exposes the app chalk instance to command handlers', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .run(function() {
                expect(this.chalk.blue('blue')).toBe('\u001B[34mblue\u001B[39m')
            })

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--color=always'])

        expect(result).toEqual({code: null})
    })

    it('shows the built-in color option in help text with an optional value placeholder', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello').meta({bin: 'cli-api', description: 'Example app'}).run(() => {})",
                    "await executeAppResult(app, ['--help', '--no-color'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('--color[=WHEN]')
        expect(output).not.toContain('\u001B[')
    })

    it('shows custom global options in help text', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App, Command} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello')",
                    "  .meta({bin: 'cli-api', description: 'Example app'})",
                    "  .globalOpt('profile', {alias: 'p', description: 'Select a profile'})",
                    "  .command(new Command('world').run(() => {}))",
                    "await executeAppResult(app, ['world', '--help'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')
        expect(result.stdout.toString()).toContain('--profile=PROFILE')
    })

    it('wraps long command descriptions onto indented lines in root help', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App, Command} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello')",
                    "  .meta({bin: 'cli-api', description: 'Example app'})",
                    "  .command(new Command('world').describe('This description is intentionally long so it cannot fit on a single command listing line inside the default help renderer width.'))",
                    "await executeAppResult(app, ['--help'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('  world\n')
        expect(output).toContain('\n          This description is intentionally long so it cannot fit on a single\n')
        expect(output).toContain('\n          command listing line inside the default help renderer width.\n')
    })

    it('wraps long option descriptions onto indented lines in command help', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App, Command} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello')",
                    "  .meta({bin: 'cli-api', description: 'Example app'})",
                    "  .command(new Command('world')",
                    "    .opt('profile', {alias: 'p', description: 'This description is intentionally long so it cannot fit on a single option listing line inside the default help renderer width.'})",
                    "    .run(() => {}))",
                    "await executeAppResult(app, ['world', '--help'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('  -p, --profile=PROFILE\n')
        expect(output).toContain('\n          This description is intentionally long so it cannot fit on a single\n')
        expect(output).toContain('\n          option listing line inside the default help renderer width.\n')
    })

    it('wraps every option in a section when one option needs wrapping and separates wrapped entries', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App, Command} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello')",
                    "  .meta({bin: 'cli-api', description: 'Example app'})",
                    "  .command(new Command('world')",
                    "    .opt('alpha', {alias: 'a', description: 'Short description.'})",
                    "    .opt('profile', {alias: 'p', description: 'This description is intentionally long so it cannot fit on a single option listing line inside the default help renderer width.'})",
                    "    .run(() => {}))",
                    "await executeAppResult(app, ['world', '--help'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('  -a, --alpha=ALPHA\n')
        expect(output).toContain('\n          Short description.\n\n  -p, --profile=PROFILE\n')
        expect(output).toContain('\n          This description is intentionally long so it cannot fit on a single\n')
    })

    it('enables forced color output for help when requested', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                '--eval',
                [
                    "import {App} from './src/interfaces'",
                    "import {executeAppResult} from './src/run'",
                    "const app = new App('hello').meta({bin: 'cli-api', description: 'Example app'}).run(() => {})",
                    "await executeAppResult(app, ['--help', '--color=always'])",
                ].join('\n'),
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
            env: {
                ...process.env,
                FORCE_COLOR: '0',
            },
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')
        expect(result.stdout.toString()).toContain('\u001B[')
    })

    it('returns an invalid-arg error for unsupported color values', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .run(() => {})

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--color=rainbow'])

        expect(result).toEqual({
            code: 2,
            error: createError('Invalid value "rainbow" (expected one of: always, never, auto)', ErrorCategory.InvalidArg),
        })
    })
})
