import { describe, expect, it } from 'bun:test'
import { parseArgs } from './options'
import { Command, OptType } from './interfaces'

function makeCommand() {
    return new Command('test')
}

describe(parseArgs.name, () => {
    it('parses long options with equals', () => {
        const cmd = makeCommand().opt('name', {key: 'name'})

        const [positionals, opts] = parseArgs(cmd, ['--name=mark'])

        expect(positionals).toEqual([])
        expect(opts).toEqual({ name: 'mark' })
    })

    it('parses long options with a following value', () => {
        const cmd = makeCommand().opt('out', {key: 'out'})

        const [, opts] = parseArgs(cmd, ['--out', 'file.txt'])

        expect(opts.out).toBe('file.txt')
    })

    it('parses flags from the flags property and leaves missing flags undefined', () => {
        const cmd = makeCommand()
            .flag('verbose', {alias: 'v'})
            .flag('quiet', {alias: 'q'})

        const [, opts] = parseArgs(cmd, ['-v'])

        expect(opts.verbose).toBe(true)
        expect(opts.quiet).toBeUndefined()
    })

    it('clusters short flags', () => {
        const cmd = makeCommand().flag('a').flag('b').flag('c').flag('d')

        const [, opts] = parseArgs(cmd, ['-abc'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.c).toBe(true)
        expect(opts.d).toBeUndefined()
    })

    it('parses short options with inline and next-argv values', () => {
        const cmd = makeCommand().opt('n', {key: 'n'})

        expect(parseArgs(cmd, ['-nfoo'])[1].n).toBe('foo')
        expect(parseArgs(cmd, ['-n', 'foo'])[1].n).toBe('foo')
        expect(parseArgs(cmd, ['-n=foo'])[1].n).toBe('foo')
    })

    it('does not treat clustered short options with = as a value for the first option', () => {
        const cmd = makeCommand()
            .opt('n', {key: 'n'})
            .flag('a')
            .flag('m')
            .flag('e')

        expect(() => parseArgs(cmd, ['-name=foo'])).toThrow(/missing required value for option "-n"/i)
    })

    it('reports an unknown short option before a missing value in a cluster with =', () => {
        const cmd = makeCommand().opt('n', {key: 'n'})

        expect(() => parseArgs(cmd, ['-name=foo'])).toThrow(/does not have option "a"/i)
    })

    it('uses a provided value for valueNotRequired options', () => {
        const cmd = makeCommand().opt('mode', {key: 'mode', valueNotRequired: true, defaultValue: 'auto'})

        const [, opts] = parseArgs(cmd, ['--mode=manual'])

        expect(opts.mode).toBe('manual')
    })

    it('stops a short-option cluster when an option consumes a value', () => {
        const cmd = makeCommand()
            .opt('a', {key: 'a', valueNotRequired: true})
            .opt('b', {key: 'b', valueNotRequired: true})
            .opt('n', {key: 'n'})

        const [, opts] = parseArgs(cmd, ['-abnX'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.n).toBe('X')
    })

    it('applies an =value to the last short option in a cluster', () => {
        const cmd = makeCommand()
            .flag('a')
            .flag('b')
            .opt('n', {key: 'n'})

        const [, opts] = parseArgs(cmd, ['-abn=foo'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.n).toBe('foo')
    })

    it('collects repeatable option values', () => {
        const cmd = makeCommand().opt('tag', {key: 'tags', alias: 't', repeatable: true})

        const [, opts] = parseArgs(cmd, ['--tag=a', '--tag', 'b', '-tc'])

        expect(opts.tags).toEqual(['a', 'b', 'c'])
    })

    it('treats tokens after -- as positonals', () => {
        const cmd = makeCommand()
            .opt('n', {key: 'n'})
            .arg('file', {key: 'file'})

        const [positionals, opts] = parseArgs(cmd, ['--', '-n', 'foo', 'readme.md'])

        expect(positionals).toEqual(['-n', 'foo', 'readme.md'])
        expect(opts.file).toBe('-n')
        expect(opts.n).toBeUndefined()
    })

    it('copies named positonals into opts', () => {
        const cmd = makeCommand()
            .arg('input', {key: 'input'})
            .arg('output', {key: 'output'})

        const [positionals, opts] = parseArgs(cmd, ['in.txt', 'out.txt'])

        expect(positionals).toEqual(['in.txt', 'out.txt'])
        expect(opts.input).toBe('in.txt')
        expect(opts.output).toBe('out.txt')
    })

    it('collects repeatable positonals', () => {
        const cmd = makeCommand().arg('files', {key: 'files', repeatable: true})

        const [positionals, opts] = parseArgs(cmd, ['a.js', 'b.js', 'c.js'])

        expect(positionals).toEqual(['a.js', 'b.js', 'c.js'])
        expect(opts.files).toEqual(['a.js', 'b.js', 'c.js'])
    })

    it('throws when a repeatable positional is not last', () => {
        const cmd = makeCommand()
            .arg('files', {repeatable: true})
            .arg('dest')

        expect(() => parseArgs(cmd, ['a.txt', 'b.txt'])).toThrow(/only the last positional can be repeatable/i)
    })

    it('fills defaults for missing options and positonals', () => {
        const cmd = makeCommand()
            .opt('mode', {key: 'mode', defaultValue: 'fast'})
            .arg('dst', {key: 'dst', defaultValue: 'out'})

        const [, opts] = parseArgs(cmd, [])

        expect(opts.mode).toBe('fast')
        expect(opts.dst).toBe('out')
    })

    it('throws on missing required options', () => {
        const cmd = makeCommand().opt('n', {required: true})

        expect(() => parseArgs(cmd, [])).toThrow(/option is required/i)
    })

    it('throws on missing required positonals', () => {
        const cmd = makeCommand().arg('src', {required: true})

        expect(() => parseArgs(cmd, [])).toThrow(/positional is required/i)
    })

    it('coerces option and positional types', () => {
        const cmd = makeCommand()
            .opt('count', {key: 'count', type: OptType.INT})
            .arg('scale', {key: 'scale', type: OptType.FLOAT})

        const [positionals, opts] = parseArgs(cmd, ['--count', '3', '2.5'])

        expect(opts.count).toBe(3)
        expect(opts.scale).toBe(2.5)
        expect(positionals).toEqual([2.5])
    })

    it('parses fluent builder commands with boolean flags and valued options', () => {
        const cmd = new Command('test')
            .flag('verbose', {alias: 'v'})
            .opt('name', {alias: 'n'})
            .arg('file', {required: true})
            .run(async () => {})

        const [positionals, opts] = parseArgs(cmd, ['-v', '--name=mark', 'readme.md'])

        expect(positionals).toEqual(['readme.md'])
        expect(opts).toEqual({
            verbose: true,
            name: 'mark',
            file: 'readme.md',
        })
    })
})
