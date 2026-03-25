import {describe, expect, it} from 'bun:test'
import Path from 'path'
import {App, Command} from './interfaces'
import {executeApp, executeAppResult} from './run'
import {createError, ErrorCategory} from './utils'
import {OptType} from './interfaces'

function createMisconfiguredApp(): Parameters<typeof executeAppResult>[0] {
    return new App('hello')
        .meta({bin: 'cli-api'})
        .arg('first', {repeatable: true, required: true})
        .arg('second', {repeatable: true, required: true})
        .run(() => {}) as Parameters<typeof executeAppResult>[0]
}

async function captureExecute(
    app: Parameters<typeof executeAppResult>[0],
    argv: string[],
    {color = false}: {color?: boolean} = {},
): Promise<{result: Awaited<ReturnType<typeof executeAppResult>>, output: string}> {
    let output = ''
    const originalLog = console.log
    const originalWrite = process.stdout.write
    const originalArgv = process.argv
    const effectiveArgv = color || argv.includes('--color=always') || argv.includes('--no-color')
        ? argv
        : [...argv, '--no-color']

    console.log = ((...args: unknown[]) => {
        output += args.join(' ') + '\n'
    }) as typeof console.log
    process.stdout.write = ((chunk: string | Uint8Array) => {
        output += String(chunk)
        return true
    }) as typeof process.stdout.write
    process.argv = ['bun', 'test']

    try {
        const result = await executeAppResult(app, effectiveArgv)
        return {result, output}
    } finally {
        console.log = originalLog
        process.stdout.write = originalWrite
        process.argv = originalArgv
    }
}

async function captureExecuteWithPrintedErrors(
    app: Parameters<typeof executeAppResult>[0],
    argv: string[],
    {color = false}: {color?: boolean} = {},
): Promise<{code: number, output: string}> {
    let output = ''
    const originalLog = console.log
    const originalWrite = process.stdout.write
    const originalArgv = process.argv
    const effectiveArgv = color || argv.includes('--color=always') || argv.includes('--no-color')
        ? argv
        : [...argv, '--no-color']

    console.log = ((...args: unknown[]) => {
        output += args.join(' ') + '\n'
    }) as typeof console.log
    process.stdout.write = ((chunk: string | Uint8Array) => {
        output += String(chunk)
        return true
    }) as typeof process.stdout.write
    process.argv = ['bun', 'test']

    try {
        const code = await executeApp(app, effectiveArgv)
        return {code, output}
    } finally {
        console.log = originalLog
        process.stdout.write = originalWrite
        process.argv = originalArgv
    }
}

function matchOutput(output: string, pattern: RegExp): string {
    const match = output.match(pattern)
    expect(match).not.toBeNull()
    return match![0]
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
            error: createError('Config Error: Only the last argument can be repeatable', ErrorCategory.Misconfig),
        })
    })

    it('validates misconfigured apps before handling help flags', async () => {
        const result = await executeAppResult(createMisconfiguredApp(), ['--help'])

        expect(result).toEqual({
            code: 254,
            error: createError('Config Error: Only the last argument can be repeatable', ErrorCategory.Misconfig),
        })
    })

    it('passes custom global options through to sub-command handlers', async () => {
        let captured: Record<string, unknown> | undefined
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .globalOpt('profile', {alias: 'p', required: true})
            .command(new Command('world')
                .run(opts => {
                    captured = opts
                }))

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--profile', 'dev', 'world'])

        expect(result).toEqual({code: null})
        expect(captured).toMatchObject({profile: 'dev', color: 'auto'})
    })

    it('passes positional arguments through opts without a separate args parameter', async () => {
        let captured: Record<string, unknown> | undefined
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .arg('name', {required: true})
            .arg('rest', {repeatable: true})
            .run(opts => {
                captured = opts
            })

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['Mark', 'one', 'two'])

        expect(result).toEqual({code: null})
        expect(captured).toMatchObject({name: 'Mark', rest: ['one', 'two'], color: 'auto'})
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

    it('prints app author in root help output', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', version: '1.0.0', author: 'Mark Penner', description: 'Example app'})
            .command(new Command('world'))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help'])

        expect(result).toEqual({code: 0})
        expect(output).toContain('hello ver. 1.0.0 by Mark Penner')
        expect(output).toContain('hello ver. 1.0.0 by Mark Penner\n\nExample app')
    })

    it('prints app name, version, and description for executable root app help', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', version: '1.0.0', description: 'Example app'})
            .opt('name', {required: true})
            .run(() => {})

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help'])

        expect(result).toEqual({code: 0})
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

    it('exposes the execution context chalk instance to command handlers', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .run((_, context) => {
                expect(context.chalk.blue('blue')).toBe('\u001B[34mblue\u001B[39m')
            })

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--color=always'])

        expect(result).toEqual({code: null})
    })

    it('exposes the resolved chalk color level on the execution context', async () => {
        const levels: number[] = []
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .run((_, context) => {
                levels.push(context.colorLevel)
                expect(context.colorLevel).toBe(context.chalk.level)
            })

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--color=always'])).toEqual({code: null})
        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--no-color'])).toEqual({code: null})

        expect(levels).toEqual([3, 0])
    })

    it('passes the app and resolved command path through the execution context', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .command(new Command('world')
                .run((_, context) => {
                    expect(context.app).toBe(app)
                    expect(context.commandPath).toEqual(['world'])
                }))

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['world', '--color=always'])).toEqual({code: null})
    })

    it('shows the built-in color option in help text with an optional value placeholder', async () => {
        const app = new App('hello').meta({bin: 'cli-api', description: 'Example app'}).run(() => {})

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help', '--no-color'])

        expect(result).toEqual({code: 0})
        expect(output).toContain('--color[=WHEN]')
        expect(output).not.toContain('\u001B[')
    })

    it('shows custom global options in help text', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .globalOpt('profile', {alias: 'p', description: 'Select a profile'})
            .command(new Command('world').run(() => {}))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(output).toContain('--profile=PROFILE')
    })

    it('sorts command options in help text by option name', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .command(new Command('world')
                .opt('zebra', {alias: 'z', description: 'Last alphabetically'})
                .opt('alpha', {alias: 'a', description: 'First alphabetically'})
                .run(() => {}))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(output.indexOf('-a, --alpha=ALPHA')).toBeLessThan(output.indexOf('-z, --zebra=ZEBRA'))
    })

    it('sorts global options in help text by option name', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .globalOpt('zebra', {alias: 'z', description: 'Last alphabetically'})
            .globalOpt('alpha', {alias: 'a', description: 'First alphabetically'})
            .command(new Command('world').run(() => {}))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(output.indexOf('--alpha=ALPHA')).toBeLessThan(output.indexOf('--color[=WHEN]'))
        expect(output.indexOf('--color[=WHEN]')).toBeLessThan(output.indexOf('--help'))
        expect(output.indexOf('--help')).toBeLessThan(output.indexOf('--zebra=ZEBRA'))
    })

    it('wraps long command descriptions onto indented lines in root help', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .command(new Command('world').describe('This description is intentionally long so it cannot fit on a single command listing line inside the default help renderer width.'))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help'])

        expect(result).toEqual({code: 0})
        expect(matchOutput(output, /  world[\s\S]*?(?=\n  version)/))
            .toEqualIgnoringWhitespace(`
                world
                This description is intentionally long so it cannot fit on a single
                command listing line inside the default help renderer width.
            `)
    })

    it('wraps long option descriptions onto indented lines in command help', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .command(new Command('world')
                .opt('profile', {alias: 'p', description: 'This description is intentionally long so it cannot fit on a single option listing line inside the default help renderer width.'})
                .run(() => {}))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(matchOutput(output, /  -p, --profile=PROFILE[\s\S]*?(?=\n\nGlobal Options:)/))
            .toEqualIgnoringWhitespace(`
                -p, --profile=PROFILE
                This description is intentionally long so it cannot fit on a single
                option listing line inside the default help renderer width.
            `)
    })

    it('wraps every option in a section when one option needs wrapping and separates wrapped entries', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .command(new Command('world')
                .opt('alpha', {alias: 'a', description: 'Short description.'})
                .opt('profile', {alias: 'p', description: 'This description is intentionally long so it cannot fit on a single option listing line inside the default help renderer width.'})
                .run(() => {}))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(matchOutput(output, /  -a, --alpha=ALPHA[\s\S]*?(?=\n\nGlobal Options:)/))
            .toEqualIgnoringWhitespace(`
                -a, --alpha=ALPHA
                Short description.

                -p, --profile=PROFILE
                This description is intentionally long so it cannot fit on a single
                option listing line inside the default help renderer width.
            `)
    })

    it('prints the long description directly after the short description in command help', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .command(new Command('world')
                .describe(
                    'Abandon a revision',
                    'Abandon a revision, rebasing descendants onto its parent(s).\nThe behavior is similar to `jj restore --changes-in`.',
                )
                .run(() => {}))

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(output).toContain(`Abandon a revision

Abandon a revision, rebasing descendants onto its parent(s).
The behavior is similar to \`jj restore --changes-in\`.

Usage:`)
        expect(output).not.toContain('Description:')
    })

    it('enables forced color output for help when requested', async () => {
        const app = new App('hello').meta({bin: 'cli-api', description: 'Example app'}).run(() => {})

        const {result, output} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help', '--color=always'], {color: true})

        expect(result).toEqual({code: 0})
        expect(output).toContain('\u001B[')
    })

    it('returns an invalid-arg error for unsupported color values', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .run(() => {})

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--color=rainbow'])

        expect(result).toEqual({
            code: 2,
            error: createError('Invalid value "rainbow" for option `--color` (expected one of: always, never, auto)', ErrorCategory.InvalidArg),
        })
    })

    it('uses the parsed color mode for coercion errors instead of process argv sniffing', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('kubeconfig', {type: OptType.INPUT_FILE, required: true})
            .run(() => {})

        const {code, output} = await captureExecuteWithPrintedErrors(
            app as Parameters<typeof executeAppResult>[0],
            ['--kubeconfig=foo', '--color=always'],
            {color: false},
        )

        expect(code).toBe(2)
        expect(output).toContain('\u001B[')
        expect(output).toContain('does not exist')
    })
})
