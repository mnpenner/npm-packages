import { describe, expect, it } from 'bun:test'
import { parseArgs } from './options'
import { defineCommand, OptType } from './interfaces'

function makeCommand() {
    return defineCommand({
        name: 'test',
        async execute() {},
    })
}

describe(parseArgs.name, () => {
    it('parses long options with equals', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'name', key: 'name' }],
        })

        const [positionals, opts] = parseArgs(cmd, ['--name=mark'])

        expect(positionals).toEqual([])
        expect(opts).toEqual({ name: 'mark' })
    })

    it('parses long options with a following value', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'out', key: 'out' }],
        })

        const [, opts] = parseArgs(cmd, ['--out', 'file.txt'])

        expect(opts.out).toBe('file.txt')
    })

    it('parses flags from the flags property and leaves missing flags undefined', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            flags: [
                { name: 'verbose', alias: 'v' },
                { name: 'quiet', alias: 'q' },
            ],
        })

        const [, opts] = parseArgs(cmd, ['-v'])

        expect(opts.verbose).toBe(true)
        expect(opts.quiet).toBeUndefined()
    })

    it('clusters short flags', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            flags: [
                { name: 'a' },
                { name: 'b' },
                { name: 'c' },
                { name: 'd' },
            ],
        })

        const [, opts] = parseArgs(cmd, ['-abc'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.c).toBe(true)
        expect(opts.d).toBeUndefined()
    })

    it('parses short options with inline and next-argv values', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'n', key: 'n' }],
        })

        expect(parseArgs(cmd, ['-nfoo'])[1].n).toBe('foo')
        expect(parseArgs(cmd, ['-n', 'foo'])[1].n).toBe('foo')
        expect(parseArgs(cmd, ['-n=foo'])[1].n).toBe('foo')
    })

    it('uses a provided value for valueNotRequired options', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'mode', key: 'mode', valueNotRequired: true, defaultValue: 'auto' }],
        })

        const [, opts] = parseArgs(cmd, ['--mode=manual'])

        expect(opts.mode).toBe('manual')
    })

    it('stops a short-option cluster when an option consumes a value', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [
                { name: 'a', key: 'a', valueNotRequired: true },
                { name: 'b', key: 'b', valueNotRequired: true },
                { name: 'n', key: 'n' },
            ],
        })

        const [, opts] = parseArgs(cmd, ['-abnX'])

        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.n).toBe('X')
    })

    it('collects repeatable option values', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'tag', key: 'tags', alias: 't', repeatable: true }],
        })

        const [, opts] = parseArgs(cmd, ['--tag=a', '--tag', 'b', '-tc'])

        expect(opts.tags).toEqual(['a', 'b', 'c'])
    })

    it('treats tokens after -- as positonals', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'n', key: 'n' }],
            positonals: [{ name: 'file', key: 'file' }],
        })

        const [positionals, opts] = parseArgs(cmd, ['--', '-n', 'foo', 'readme.md'])

        expect(positionals).toEqual(['-n', 'foo', 'readme.md'])
        expect(opts.file).toBe('-n')
        expect(opts.n).toBeUndefined()
    })

    it('copies named positonals into opts', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            positonals: [
                { name: 'input', key: 'input' },
                { name: 'output', key: 'output' },
            ],
        })

        const [positionals, opts] = parseArgs(cmd, ['in.txt', 'out.txt'])

        expect(positionals).toEqual(['in.txt', 'out.txt'])
        expect(opts.input).toBe('in.txt')
        expect(opts.output).toBe('out.txt')
    })

    it('collects repeatable positonals', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            positonals: [{ name: 'files', key: 'files', repeatable: true }],
        })

        const [positionals, opts] = parseArgs(cmd, ['a.js', 'b.js', 'c.js'])

        expect(positionals).toEqual(['a.js', 'b.js', 'c.js'])
        expect(opts.files).toEqual(['a.js', 'b.js', 'c.js'])
    })

    it('throws when a repeatable positional is not last', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            positonals: [
                { name: 'files', repeatable: true },
                { name: 'dest' },
            ],
        })

        expect(() => parseArgs(cmd, ['a.txt', 'b.txt'])).toThrow(/only the last positional can be repeatable/i)
    })

    it('fills defaults for missing options and positonals', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'mode', key: 'mode', defaultValue: 'fast' }],
            positonals: [{ name: 'dst', key: 'dst', defaultValue: 'out' }],
        })

        const [, opts] = parseArgs(cmd, [])

        expect(opts.mode).toBe('fast')
        expect(opts.dst).toBe('out')
    })

    it('throws on missing required options', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'n', required: true }],
        })

        expect(() => parseArgs(cmd, [])).toThrow(/option is required/i)
    })

    it('throws on missing required positonals', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            positonals: [{ name: 'src', required: true }],
        })

        expect(() => parseArgs(cmd, [])).toThrow(/positional is required/i)
    })

    it('coerces option and positional types', () => {
        const cmd = defineCommand({
            ...makeCommand(),
            options: [{ name: 'count', key: 'count', type: OptType.INT }],
            positonals: [{ name: 'scale', key: 'scale', type: OptType.FLOAT }],
        })

        const [positionals, opts] = parseArgs(cmd, ['--count', '3', '2.5'])

        expect(opts.count).toBe(3)
        expect(opts.scale).toBe(2.5)
        expect(positionals).toEqual([2.5])
    })
})
