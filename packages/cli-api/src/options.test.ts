import { describe, expect, it } from 'bun:test'
import {createChalk} from './color'
import { formatOption, parseArgs as parseArgsBase } from './options'
import { Command, OptType } from './interfaces'

function makeCommand() {
    return new Command('test')
}

const chalk = createChalk('never')

function parseArgs(cmd: Parameters<typeof parseArgsBase>[0], argv: string[]) {
    return parseArgsBase(cmd, argv, chalk)
}

describe(parseArgs.name, () => {
    it('parses long options with equals', () => {
        const cmd = makeCommand().opt('name', {propName: 'name'})

        const [arguments_, opts] = parseArgs(cmd, ['--name=mark'])

        expect(arguments_).toEqual([])
        expect(opts).toEqual({ name: 'mark' })
    })

    it('parses long options with a following value', () => {
        const cmd = makeCommand().opt('out', {propName: 'out'})

        const [, opts] = parseArgs(cmd, ['--out', 'file.txt'])

        expect(opts.out).toBe('file.txt')
    })

    it('parses flags from the flags property and defaults missing flags to false', () => {
        const cmd = makeCommand()
            .flag('verbose', {alias: 'v'})
            .flag('quiet', {alias: 'q'})

        const [, opts] = parseArgs(cmd, ['-v'])

        expect(opts.verbose).toBe(true)
        expect(opts.quiet).toBe(false)
    })

    it('clusters short flags', () => {
        const cmd = makeCommand().flag('a').flag('b').flag('c').flag('d')

        const [, opts] = parseArgs(cmd, ['-abc'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.c).toBe(true)
        expect(opts.d).toBe(false)
    })

    it('parses short options with inline and next-argv values', () => {
        const cmd = makeCommand().opt('n', {propName: 'n'})

        expect(parseArgs(cmd, ['-nfoo'])[1].n).toBe('foo')
        expect(parseArgs(cmd, ['-n', 'foo'])[1].n).toBe('foo')
        expect(parseArgs(cmd, ['-n=foo'])[1].n).toBe('foo')
    })

    it('does not treat clustered short options with = as a value for the first option', () => {
        const cmd = makeCommand()
            .opt('n', {propName: 'n'})
            .flag('a')
            .flag('m')
            .flag('e')

        expect(() => parseArgs(cmd, ['-name=foo'])).toThrow(/missing required value for option [`"]-n[`"]/i)
    })

    it('reports an unknown short option before a missing value in a cluster with =', () => {
        const cmd = makeCommand().opt('n', {propName: 'n'})

        expect(() => parseArgs(cmd, ['-name=foo'])).toThrow('option `-a` not recognized')
    })

    it('reports unknown short options with the canonical parser message', () => {
        const cmd = makeCommand()

        expect(() => parseArgs(cmd, ['-a'])).toThrow('option `-a` not recognized')
    })

    it('formats unknown option tokens with formatToken when color is enabled', () => {
        const cmd = makeCommand()
        const colorChalk = createChalk('always')

        expect(() => parseArgsBase(cmd, ['-a'], colorChalk)).toThrow(`option ${colorChalk.bold('-a')} not recognized`)
    })

    it('uses a provided value for valueNotRequired options', () => {
        const cmd = makeCommand().opt('mode', {propName: 'mode', valueNotRequired: true, defaultValue: 'auto'})

        const [, opts] = parseArgs(cmd, ['--mode=manual'])

        expect(opts.mode).toBe('manual')
    })

    it('stops a short-option cluster when an option consumes a value', () => {
        const cmd = makeCommand()
            .opt('a', {propName: 'a', valueNotRequired: true})
            .opt('b', {propName: 'b', valueNotRequired: true})
            .opt('n', {propName: 'n'})

        const [, opts] = parseArgs(cmd, ['-abnX'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.n).toBe('X')
    })

    it('applies an =value to the last short option in a cluster', () => {
        const cmd = makeCommand()
            .flag('a')
            .flag('b')
            .opt('n', {propName: 'n'})

        const [, opts] = parseArgs(cmd, ['-abn=foo'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.n).toBe('foo')
    })

    it('collects repeatable option values', () => {
        const cmd = makeCommand().opt('tag', {propName: 'tags', alias: 't', repeatable: true})

        const [, opts] = parseArgs(cmd, ['--tag=a', '--tag', 'b', '-tc'])

        expect(opts.tags).toEqual(['a', 'b', 'c'])
    })

    it('initializes missing repeatable options as empty arrays', () => {
        const cmd = makeCommand().opt('tag', {propName: 'tags', repeatable: true})

        const [, opts] = parseArgs(cmd, [])

        expect(opts.tags).toEqual([])
    })

    it('treats tokens after -- as arguments', () => {
        const cmd = makeCommand()
            .opt('n', {propName: 'n'})
            .arg('file', {propName: 'file'})

        const [arguments_, opts] = parseArgs(cmd, ['--', '-n', 'foo', 'readme.md'])

        expect(arguments_).toEqual(['-n', 'foo', 'readme.md'])
        expect(opts.file).toBe('-n')
        expect(opts.n).toBeUndefined()
    })

    it('copies named arguments into opts', () => {
        const cmd = makeCommand()
            .arg('input', {propName: 'input'})
            .arg('output', {propName: 'output'})

        const [arguments_, opts] = parseArgs(cmd, ['in.txt', 'out.txt'])

        expect(arguments_).toEqual(['in.txt', 'out.txt'])
        expect(opts.input).toBe('in.txt')
        expect(opts.output).toBe('out.txt')
    })

    it('collects repeatable arguments', () => {
        const cmd = makeCommand().arg('files', {propName: 'files', repeatable: true})

        const [arguments_, opts] = parseArgs(cmd, ['a.js', 'b.js', 'c.js'])

        expect(arguments_).toEqual(['a.js', 'b.js', 'c.js'])
        expect(opts.files).toEqual(['a.js', 'b.js', 'c.js'])
    })

    it('initializes missing optional repeatable arguments as empty arrays', () => {
        const cmd = makeCommand()
            .arg('input', {required: true})
            .arg('files', {propName: 'files', repeatable: true})

        const [, opts] = parseArgs(cmd, ['main.ts'])

        expect(opts.files).toEqual([])
    })

    it('requires at least one value for required repeatable arguments', () => {
        const cmd = makeCommand()
            .arg('name', {required: true})
            .arg('disclaimer', {propName: 'disclaimer', repeatable: true, required: true})

        expect(() => parseArgs(cmd, ['tom'])).toThrow(/[`"]disclaimer[`"] argument requires at least 1 value/i)
    })

    it('supports numeric minimum counts for repeatable arguments', () => {
        const cmd = makeCommand().arg('files', {propName: 'files', repeatable: true, required: 2})

        expect(() => parseArgs(cmd, ['a.txt'])).toThrow(/[`"]files[`"] argument requires at least 2 values/i)
        expect(parseArgs(cmd, ['a.txt', 'b.txt'])[1].files).toEqual(['a.txt', 'b.txt'])
    })

    it('supports numeric maximum counts for repeatable arguments', () => {
        const cmd = makeCommand().arg('files', {propName: 'files', repeatable: 2})

        expect(() => parseArgs(cmd, ['a.txt', 'b.txt', 'c.txt'])).toThrow(/"files" argument allows at most 2 values/i)
    })

    it('supports numeric maximum counts for repeatable options', () => {
        const cmd = makeCommand().opt('tag', {propName: 'tags', repeatable: 2})

        expect(() => parseArgs(cmd, ['--tag=a', '--tag=b', '--tag=c'])).toThrow(/"tag" option allows at most 2 values/i)
    })

    it('parses repeatable arguments before required trailing arguments', () => {
        const cmd = makeCommand()
            .arg('alpha', {propName: 'alpha', repeatable: true})
            .arg('beta', {propName: 'beta', required: true})

        expect(parseArgs(cmd, ['tail'])[1]).toMatchObject({alpha: [], beta: 'tail'})

        const [arguments_, opts] = parseArgs(cmd, ['one', 'two', 'tail'])

        expect(arguments_).toEqual(['one', 'two', 'tail'])
        expect(opts.alpha).toEqual(['one', 'two'])
        expect(opts.beta).toBe('tail')
    })

    it('throws when a repeatable argument is followed by a non-fixed argument', () => {
        const cmd = makeCommand()
            .arg('files', {repeatable: true})
            .arg('dest')

        expect(() => parseArgs(cmd, ['a.txt', 'b.txt'])).toThrow(/repeatable arguments can only be followed by required arguments with fixed counts/i)
    })

    it('throws when a required argument comes after an optional argument', () => {
        const cmd = makeCommand()
            .arg('maybe')
            .arg('must', {required: true})

        expect(() => parseArgs(cmd, ['value'])).toThrow(/required arguments cannot come after optional arguments/i)
    })

    it('throws when a numeric required count is used on a non-repeatable argument', () => {
        const cmd = makeCommand().arg('files', {required: 2})

        expect(() => parseArgs(cmd, ['a.txt'])).toThrow(/cannot use a numeric required count unless it is repeatable/i)
    })

    it('throws when a repeatable argument minimum exceeds its maximum', () => {
        const cmd = makeCommand().arg('files', {repeatable: 2, required: 3})

        expect(() => parseArgs(cmd, ['a.txt'])).toThrow(/requires at least 3 values but allows at most 2/i)
    })

    it('fills defaults for missing options and arguments', () => {
        const cmd = makeCommand()
            .opt('mode', {propName: 'mode', defaultValue: 'fast'})
            .arg('dst', {propName: 'dst', defaultValue: 'out'})

        const [, opts] = parseArgs(cmd, [])

        expect(opts.mode).toBe('fast')
        expect(opts.dst).toBe('out')
    })

    it('throws on missing required options', () => {
        const cmd = makeCommand().opt('n', {required: true})

        expect(() => parseArgs(cmd, [])).toThrow(/option is required/i)
    })

    it('throws on missing required arguments', () => {
        const cmd = makeCommand().arg('src', {required: true})

        expect(() => parseArgs(cmd, [])).toThrow(/argument is required/i)
    })

    it('coerces option and argument types', () => {
        const cmd = makeCommand()
            .opt('count', {propName: 'count', type: OptType.INT})
            .arg('scale', {propName: 'scale', type: OptType.FLOAT})

        const [arguments_, opts] = parseArgs(cmd, ['--count', '3', '2.5'])

        expect(opts.count).toBe(3)
        expect(opts.scale).toBe(2.5)
        expect(arguments_).toEqual([2.5])
    })

    it('parses fluent builder commands with boolean flags and valued options', () => {
        const cmd = new Command('test')
            .flag('verbose', {alias: 'v'})
            .opt('name', {alias: 'n'})
            .arg('file', {required: true})
            .run(async () => {})

        const [arguments_, opts] = parseArgs(cmd, ['-v', '--name=mark', 'readme.md'])

        expect(arguments_).toEqual(['readme.md'])
        expect(opts).toEqual({
            verbose: true,
            name: 'mark',
            file: 'readme.md',
        })
    })

    it('treats bool typed options as valueNotRequired when unspecified', () => {
        const cmd = makeCommand().opt('enabled', {propName: 'enabled', type: OptType.BOOL})

        const [, opts] = parseArgs(cmd, ['--enabled'])

        expect(opts.enabled).toBe(true)
    })

    it('defaults missing bool typed options to false', () => {
        const cmd = makeCommand().opt('enabled', {propName: 'enabled', type: OptType.BOOL})

        const [, opts] = parseArgs(cmd, [])

        expect(opts.enabled).toBe(false)
    })

    it('supports bulk option and argument builders', () => {
        const cmd = makeCommand()
            .options([
                {name: 'verbose', alias: 'v', type: OptType.BOOL},
                {name: 'count', propName: 'count', type: OptType.INT},
            ] as const)
            .arguments([
                {name: 'file', required: true},
            ] as const)

        const [arguments_, opts] = parseArgs(cmd, ['-v', '--count', '3', 'readme.md'])

        expect(arguments_).toEqual(['readme.md'])
        expect(opts).toEqual({
            verbose: true,
            count: 3,
            file: 'readme.md',
        })
    })
})

describe(formatOption.name, () => {
    it('renders valueNotRequired options with bracketed optional values in help text', () => {
        const chalk = createChalk('never')
        const [flags, description] = formatOption({
            alias: 's',
            description: 'Shout the greeting',
            name: 'shout',
            valueNotRequired: true,
        }, chalk)

        expect(flags).toBe(`${chalk.green('-s')}, ${chalk.green('--shout')}${chalk.grey('[')}=${chalk.magenta('SHOUT')}${chalk.grey(']')}`)
        expect(description).toBe('Shout the greeting')
    })

    it('renders required option values with = placeholders', () => {
        const chalk = createChalk('never')
        const [flags, description] = formatOption({
            alias: 'n',
            description: 'Person you want to greet',
            name: 'name',
            valuePlaceholder: 'person',
        }, chalk)

        expect(flags).toBe(`${chalk.green('-n')}, ${chalk.green('--name')}=${chalk.magenta('person')}`)
        expect(description).toBe('Person you want to greet')
    })

    it('uppercases inferred placeholders when no explicit placeholder is provided', () => {
        const chalk = createChalk('never')
        const [flags, description] = formatOption({
            alias: 'o',
            description: 'Output file',
            name: 'output',
        }, chalk)

        expect(flags).toBe(`${chalk.green('-o')}, ${chalk.green('--output')}=${chalk.magenta('OUTPUT')}`)
        expect(description).toBe('Output file')
    })

    it('indents aliasless long options so they align with aliased entries', () => {
        const chalk = createChalk('never')
        const [flags, description] = formatOption({
            description: 'Shout the greeting',
            name: 'shout',
            valueNotRequired: true,
        }, chalk)

        expect(flags).toBe(`    ${chalk.green('--shout')}${chalk.grey('[')}=${chalk.magenta('SHOUT')}${chalk.grey(']')}`)
        expect(description).toBe('Shout the greeting')
    })

    it('renders noPrefix aliases separately and lists enum values in help text', () => {
        const chalk = createChalk('never')
        const [flags, description] = formatOption({
            description: 'Control ANSI color output.',
            enumValues: ['always', 'never', 'auto'],
            name: 'color',
            noPrefix: true,
            type: OptType.ENUM,
            valueNotRequired: true,
            valuePlaceholder: 'WHEN',
        }, chalk)

        expect(flags).toBe(`    ${chalk.green('--color')}${chalk.grey('[')}=${chalk.magenta('WHEN')}${chalk.grey(']')}, ${chalk.green('--no-color')}`)
        expect(description).toBe('Control ANSI color output. [possible values: always, never, auto]')
    })

    it('does not render an implicit default for bool options', () => {
        const chalk = createChalk('never')
        const [flags, description] = formatOption({
            description: 'Enable verbose output',
            name: 'verbose',
            type: OptType.BOOL,
        }, chalk)

        expect(flags).toBe(`    ${chalk.green('--verbose')}`)
        expect(description).toBe('Enable verbose output')
    })
})


