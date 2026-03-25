import {describe, expect, it} from 'bun:test'
import Path from 'path'
import {App, Command} from './interfaces'
import {executeApp, executeAppResult} from './run'
import {createError, ErrorCategory} from './utils'
import {OptType} from './interfaces'
import {createChalk} from './color'

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
): Promise<{result: Awaited<ReturnType<typeof executeAppResult>>, stdout: string, stderr: string}> {
    let stdout = ''
    let stderr = ''
    const originalLog = console.log
    const originalError = console.error
    const originalWrite = process.stdout.write
    const originalErrWrite = process.stderr.write
    const originalArgv = process.argv
    const effectiveArgv = color || argv.includes('--color=always') || argv.includes('--no-color')
        ? argv
        : [...argv, '--no-color']

    console.log = ((...args: unknown[]) => {
        stdout += args.join(' ') + '\n'
    }) as typeof console.log
    console.error = ((...args: unknown[]) => {
        stderr += args.join(' ') + '\n'
    }) as typeof console.error
    process.stdout.write = ((chunk: string | Uint8Array) => {
        stdout += String(chunk)
        return true
    }) as typeof process.stdout.write
    process.stderr.write = ((chunk: string | Uint8Array) => {
        stderr += String(chunk)
        return true
    }) as typeof process.stderr.write
    process.argv = ['bun', 'test']

    try {
        const result = await executeAppResult(app, effectiveArgv)
        return {result, stdout, stderr}
    } finally {
        console.log = originalLog
        console.error = originalError
        process.stdout.write = originalWrite
        process.stderr.write = originalErrWrite
        process.argv = originalArgv
    }
}

async function captureExecuteWithPrintedErrors(
    app: Parameters<typeof executeAppResult>[0],
    argv: string[],
    {color = false, stderrColumns}: {color?: boolean, stderrColumns?: number} = {},
): Promise<{code: number, stdout: string, stderr: string}> {
    let stdout = ''
    let stderr = ''
    const originalLog = console.log
    const originalError = console.error
    const originalWrite = process.stdout.write
    const originalErrWrite = process.stderr.write
    const originalArgv = process.argv
    const originalColumns = process.stderr.columns
    const effectiveArgv = color || argv.includes('--color=always') || argv.includes('--no-color')
        ? argv
        : [...argv, '--no-color']

    console.log = ((...args: unknown[]) => {
        stdout += args.join(' ') + '\n'
    }) as typeof console.log
    console.error = ((...args: unknown[]) => {
        stderr += args.join(' ') + '\n'
    }) as typeof console.error
    process.stdout.write = ((chunk: string | Uint8Array) => {
        stdout += String(chunk)
        return true
    }) as typeof process.stdout.write
    process.stderr.write = ((chunk: string | Uint8Array) => {
        stderr += String(chunk)
        return true
    }) as typeof process.stderr.write
    if(stderrColumns !== undefined) {
        Object.defineProperty(process.stderr, 'columns', {
            configurable: true,
            value: stderrColumns,
        })
    }
    process.argv = ['bun', 'test']

    try {
        const code = await executeApp(app, effectiveArgv)
        return {code, stdout, stderr}
    } finally {
        console.log = originalLog
        console.error = originalError
        process.stdout.write = originalWrite
        process.stderr.write = originalErrWrite
        Object.defineProperty(process.stderr, 'columns', {
            configurable: true,
            value: originalColumns,
        })
        process.argv = originalArgv
    }
}

function matchOutput(output: string, pattern: RegExp): string {
    const match = output.match(pattern)
    expect(match).not.toBeNull()
    return match![0]
}

describe(executeAppResult.name, () => {
    const missingPath = Path.resolve('foo')
    const quotedMissingPath = `"${missingPath}"`
    const colorChalk = createChalk('always')

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
            error: createError('cli-api: option `-a` not recognized', ErrorCategory.InvalidArg),
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
            error: createError('cli-api: option `-a` not recognized', ErrorCategory.InvalidArg),
        })
    })

    it('returns misconfiguration errors with the config prefix and style', async () => {
        const result = await executeAppResult(createMisconfiguredApp(), [])

        expect(result).toEqual({
            code: 254,
            error: createError('Config Error: Repeatable arguments can only be followed by required arguments with fixed counts', ErrorCategory.Misconfig),
        })
    })

    it('validates misconfigured apps before handling help flags', async () => {
        const result = await executeAppResult(createMisconfiguredApp(), ['--help'])

        expect(result).toEqual({
            code: 254,
            error: createError('Config Error: Repeatable arguments can only be followed by required arguments with fixed counts', ErrorCategory.Misconfig),
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

    it('passes repeatable positional arguments through opts before a required trailing positional', async () => {
        let captured: Record<string, unknown> | undefined
        const app = new App('repeatable')
            .meta({bin: 'cli-api'})
            .arg('alpha', {repeatable: true})
            .arg('beta', {required: true})
            .run(opts => {
                captured = opts
            })

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['one', 'two', 'tail'])

        expect(result).toEqual({code: null})
        expect(captured).toMatchObject({alpha: ['one', 'two'], beta: 'tail', color: 'auto'})
    })

    it('prints help for commands with a repeatable positional before a required trailing positional', async () => {
        const app = new App('repeatable')
            .meta({bin: 'cli-api'})
            .arg('alpha', {repeatable: true})
            .arg('beta', {required: true})
            .run(() => {})

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help'])

        expect(result).toEqual({code: 0})
        expect(stdout).toContain('[alpha...] <beta>')
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

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help'])

        expect(result).toEqual({code: 0})
        expect(stdout).toContain('hello ver. 1.0.0 by Mark Penner')
        expect(stdout).toContain('hello ver. 1.0.0 by Mark Penner\n\nExample app')
    })

    it('prints app name, version, and description for executable root app help', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', version: '1.0.0', description: 'Example app'})
            .opt('name', {required: true})
            .run(() => {})

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help'])

        expect(result).toEqual({code: 0})
        expect(stdout).toContain('Example app')
        expect(stdout).toContain('Usage:')
        expect(stdout).toContain('--name=NAME')
        expect(stdout).toContain('Global Options:')
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

    it('runs the option-types example help without module export errors', () => {
        const result = Bun.spawnSync({
            cmd: [
                process.execPath,
                'examples/option-types.ts',
                '-h',
            ],
            cwd: Path.resolve(import.meta.dir, '..'),
            stdout: 'pipe',
            stderr: 'pipe',
        })

        expect(result.exitCode).toBe(0)
        expect(result.stderr.toString()).toBe('')

        const output = result.stdout.toString()
        expect(output).toContain('Example app showcasing every built-in OptType.')
        expect(output).toContain('Usage:')
        expect(output).toContain('--text=TEXT')
        expect(output).toContain('--enabled')
        expect(output).toContain('--count=#')
        expect(output).toContain('--ratio=#')
        expect(output).toContain('--mode=FAST|SLOW')
        expect(output).toContain('--input-file=FILE')
        expect(output).toContain('--input-dir=DIR')
        expect(output).toContain('--output-file=FILE')
        expect(output).toContain('--output-dir=DIR')
        expect(output).toContain('--scratch-dir=DIR')
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

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help', '--no-color'])

        expect(result).toEqual({code: 0})
        expect(stdout).toContain('--color[=WHEN]')
        expect(stdout).not.toContain('\u001B[')
    })

    it('shows the built-in version option in help text', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', version: '1.0.0', description: 'Example app'})
            .run(() => {})

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help', '--no-color'])

        expect(result).toEqual({code: 0})
        expect(stdout).toContain('--version')
    })

    it('supports renaming the built-in version option independently of the version command', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', version: '1.0.0', description: 'Example app'})
            .version({name: 'versión', alias: 'V', disableCommand: true})
            .run(() => {})

        const version = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['-V'])
        const help = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help', '--no-color'])

        expect(version.result).toEqual({code: 0})
        expect(version.stdout).toBe('1.0.0\n')
        expect(help.result).toEqual({code: 0})
        expect(help.stdout).toContain('-V, --versión')
        expect(help.stdout).not.toContain('--version')
        expect(help.stdout).not.toContain('\n  version')
    })

    it('supports renaming and disabling built-in help and version entries independently', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', version: '1.0.0', description: 'Example app'})
            .help({name: 'aide', alias: ['a'], disableCommand: true, disableOption: false})
            .version({name: 'versión', alias: 'V', disableCommand: false, disableOption: true})
            .command(new Command('world').run(() => {}))

        const help = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--aide'])
        const version = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['V'])
        const disabledHelpCommand = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['aide'])

        expect(help.result).toEqual({code: 0})
        expect(help.stdout).toContain('-a, --aide')
        expect(help.stdout).not.toContain('--help')
        expect(help.stdout).not.toContain('--version')
        expect(help.stdout).toContain('  versión')
        expect(help.stdout).not.toContain('  help')
        expect(version.result).toEqual({code: 0})
        expect(version.stdout).toBe('1.0.0\n')
        expect(disabledHelpCommand).toEqual({
            code: 2,
            error: createError("cli-api: unknown command 'aide'", ErrorCategory.InvalidArg),
        })
    })

    it('shows custom global options in help text', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .globalOpt('profile', {alias: 'p', description: 'Select a profile'})
            .command(new Command('world').run(() => {}))

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(stdout).toContain('--profile=PROFILE')
    })

    it('sorts command options in help text by option name', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .command(new Command('world')
                .opt('zebra', {alias: 'z', description: 'Last alphabetically'})
                .opt('alpha', {alias: 'a', description: 'First alphabetically'})
                .run(() => {}))

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(stdout.indexOf('-a, --alpha=ALPHA')).toBeLessThan(stdout.indexOf('-z, --zebra=ZEBRA'))
    })

    it('sorts global options in help text by option name', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .globalOpt('zebra', {alias: 'z', description: 'Last alphabetically'})
            .globalOpt('alpha', {alias: 'a', description: 'First alphabetically'})
            .command(new Command('world').run(() => {}))

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(stdout.indexOf('--alpha=ALPHA')).toBeLessThan(stdout.indexOf('--color[=WHEN]'))
        expect(stdout.indexOf('--color[=WHEN]')).toBeLessThan(stdout.indexOf('--help'))
        expect(stdout.indexOf('--help')).toBeLessThan(stdout.indexOf('--version'))
        expect(stdout.indexOf('--version')).toBeLessThan(stdout.indexOf('--zebra=ZEBRA'))
    })

    it('wraps long command descriptions onto indented lines in root help', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api', description: 'Example app'})
            .command(new Command('world').describe('This description is intentionally long so it cannot fit on a single command listing line inside the default help renderer width.'))

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help'])

        expect(result).toEqual({code: 0})
        expect(matchOutput(stdout, /  world[\s\S]*?(?=\n  version)/))
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

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(matchOutput(stdout, /  -p, --profile=PROFILE[\s\S]*?(?=\n\nGlobal Options:)/))
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

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(matchOutput(stdout, /  -a, --alpha=ALPHA[\s\S]*?(?=\n\nGlobal Options:)/))
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

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['world', '--help'])

        expect(result).toEqual({code: 0})
        expect(stdout).toContain(`Abandon a revision

Abandon a revision, rebasing descendants onto its parent(s).
The behavior is similar to \`jj restore --changes-in\`.

Usage:`)
        expect(stdout).not.toContain('Description:')
    })

    it('enables forced color output for help when requested', async () => {
        const app = new App('hello').meta({bin: 'cli-api', description: 'Example app'}).run(() => {})

        const {result, stdout} = await captureExecute(app as Parameters<typeof executeAppResult>[0], ['--help', '--color=always'], {color: true})

        expect(result).toEqual({code: 0})
        expect(stdout).toContain('\u001B[')
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

        const {code, stdout, stderr} = await captureExecuteWithPrintedErrors(
            app as Parameters<typeof executeAppResult>[0],
            ['--kubeconfig=foo', '--color=always'],
            {color: false},
        )

        expect(code).toBe(2)
        expect(stdout).toBe('')
        expect(stderr).toContain('\u001B[')
        expect(stderr).toContain('does not exist')
    })

    it('prints invalid argument errors inline to stderr when color is disabled', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('kubeconfig', {type: OptType.INPUT_FILE, required: true})
            .run(() => {})

        const {code, stdout, stderr} = await captureExecuteWithPrintedErrors(
            app as Parameters<typeof executeAppResult>[0],
            ['--kubeconfig=foo', '--no-color'],
        )

        expect(code).toBe(2)
        expect(stdout).toBe('')
        expect(stderr).toBe(`File ${quotedMissingPath} does not exist for option \`--kubeconfig\`\n`)
    })

    it('respects color mode for global option validation errors', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .globalOpt('kubeconfig', {type: OptType.INPUT_FILE})
            .command(new Command('world').run(() => {}))

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--kubeconfig=foo', '--color=always'])).toEqual({
            code: 2,
            error: createError(`File ${colorChalk.underline(missingPath)} does not exist for option ${colorChalk.bold('--kubeconfig')}`, ErrorCategory.InvalidArg),
        })

        const {code, stdout, stderr} = await captureExecuteWithPrintedErrors(
            app as Parameters<typeof executeAppResult>[0],
            ['--kubeconfig=foo', '--no-color'],
        )

        expect(code).toBe(2)
        expect(stdout).toBe('')
        expect(stderr).toBe(`File ${quotedMissingPath} does not exist for option \`--kubeconfig\`\n`)
    })

    it('returns friendly directory validation errors with the triggering option name', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('repo', {alias: 'R', type: OptType.INPUT_DIRECTORY, required: true})
            .run(() => {})

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['-R', 'foo', '--no-color'])

        expect(result).toEqual({
            code: 2,
            error: createError(`Directory ${quotedMissingPath} does not exist for option \`-R\``, ErrorCategory.InvalidArg),
        })
    })

    it('keeps underlined paths in invalid-arg messages when color is enabled', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('kubeconfig', {type: OptType.INPUT_FILE, required: true})
            .run(() => {})

        const result = await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--kubeconfig=foo', '--color=always'])

        expect(result.code).toBe(2)
        expect(result.error).toEqual(createError(`File ${colorChalk.underline(missingPath)} does not exist for option ${colorChalk.bold('--kubeconfig')}`, ErrorCategory.InvalidArg))
    })

    it('wraps colored block errors to the terminal width', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('kubeconfig', {type: OptType.INPUT_FILE, required: true})
            .run(() => {})

        const {code, stderr} = await captureExecuteWithPrintedErrors(
            app as Parameters<typeof executeAppResult>[0],
            ['--kubeconfig=foo', '--color=always'],
            {color: true, stderrColumns: 40},
        )

        expect(code).toBe(2)
        expect(stderr).toContain('\u001B[')
        expect(stderr).toContain('  File')
        expect(stderr).toContain(`  ${colorChalk.underline(missingPath)}`)
        expect(stderr).toContain('  does not exist for option')
        expect(stderr).toContain(`  ${colorChalk.bold('--kubeconfig')}`)
        expect(stderr.split('\n').filter(Boolean).length).toBeGreaterThanOrEqual(4)
    })

    it('returns friendly primitive coercion errors with the triggering option name', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('count', {type: OptType.INT, required: true})
            .opt('ratio', {type: OptType.FLOAT})
            .opt('enabled', {type: OptType.BOOL})
            .run(() => {})

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--count=abc', '--no-color'])).toEqual({
            code: 2,
            error: createError('Invalid value "abc" for option `--count` (expected an integer)', ErrorCategory.InvalidArg),
        })

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--count=1', '--ratio=abc', '--no-color'])).toEqual({
            code: 2,
            error: createError('Invalid value "abc" for option `--ratio` (expected a number)', ErrorCategory.InvalidArg),
        })

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--count=1', '--enabled=maybe', '--no-color'])).toEqual({
            code: 2,
            error: createError('Invalid value "maybe" for option `--enabled` (expected a boolean)', ErrorCategory.InvalidArg),
        })
    })

    it('returns friendly filesystem option errors with the triggering option name', async () => {
        const app = new App('hello')
            .meta({bin: 'cli-api'})
            .opt('output', {type: OptType.OUTPUT_FILE})
            .opt('target-dir', {type: OptType.OUTPUT_DIRECTORY})
            .opt('scratch-dir', {type: OptType.EMPTY_DIRECTORY})
            .run(() => {})

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--output=foo\\bar.txt', '--no-color'])).toEqual({
            code: 2,
            error: createError(`Directory ${quotedMissingPath} does not exist for option \`--output\``, ErrorCategory.InvalidArg),
        })

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--target-dir=foo', '--no-color'])).toEqual({
            code: 2,
            error: createError(`Directory ${quotedMissingPath} does not exist for option \`--target-dir\``, ErrorCategory.InvalidArg),
        })

        expect(await executeAppResult(app as Parameters<typeof executeAppResult>[0], ['--scratch-dir=foo\\bar', '--no-color'])).toEqual({
            code: 2,
            error: createError(`Directory ${quotedMissingPath} does not exist for option \`--scratch-dir\``, ErrorCategory.InvalidArg),
        })
    })
})
