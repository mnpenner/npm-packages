import { describe, it, expect } from "bun:test"
import { parseArgs } from "./options"
import {Argument, Command, Option, OptType} from './interfaces'

// Helper: make a command with options/args.
// Assumes your getOptions(cmd) returns cmd.options || [].
function makeCmd(
    options: Option[] = [],
    args: Argument[] = []
): Command {
    return {
        name: "test",
        options,
        arguments: args,
        execute: async () => {}
    }
}

describe("parseArgs", () => {
    it("parses long option with equals", () => {
        const cmd = makeCmd([
            { name: "name", key: "name" }
        ])
        const [args, opts] = parseArgs(cmd, ["--name=mark"])
        expect(args).toEqual([])
        expect(opts.name).toBe("mark")
    })

    it("parses long option with space value", () => {
        const cmd = makeCmd([
            { name: "out", key: "out" }
        ])
        const [args, opts] = parseArgs(cmd, ["--out", "file.txt"])
        expect(opts.out).toBe("file.txt")
    })

    it("boolean flag toggles default", () => {
        const cmd = makeCmd([
            { name: "verbose", key: "verbose", valueNotRequired: true, defaultValue: false }
        ])
        const [, opts] = parseArgs(cmd, ["--verbose"])
        expect(opts.verbose).toBe(true)
    })

    it("clusters short flags: -abc", () => {
        const cmd = makeCmd([
            { name: "a", valueNotRequired: true, key: "a" },
            { name: "b", valueNotRequired: true, key: "b" },
            { name: "c", valueNotRequired: true, key: "c" }
        ])
        const [, opts] = parseArgs(cmd, ["-abc"])
        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.c).toBe(true)
    })

    it("short option with inline value: -nfoo", () => {
        const cmd = makeCmd([
            { name: "n", key: "n" } // requires value
        ])
        const [, opts] = parseArgs(cmd, ["-nfoo"])
        expect(opts.n).toBe("foo")
    })

    it("short option with next argv value: -n foo", () => {
        const cmd = makeCmd([{ name: "n", key: "n" }])
        const [, opts] = parseArgs(cmd, ["-n", "foo"])
        expect(opts.n).toBe("foo")
    })

    it("short option with equals: -n=foo", () => {
        const cmd = makeCmd([{ name: "n", key: "n" }])
        const [, opts] = parseArgs(cmd, ["-n=foo"])
        expect(opts.n).toBe("foo")
    })

    it("cluster stops at value-taking short opt: -abnX", () => {
        const cmd = makeCmd([
            { name: "a", key: "a", valueNotRequired: true },
            { name: "b", key: "b", valueNotRequired: true },
            { name: "n", key: "n" } // requires value
        ])
        const [, opts] = parseArgs(cmd, ["-abnX"])
        expect(opts.a).toBe(true)
        expect(opts.b).toBe(true)
        expect(opts.n).toBe("X")
    })

    it("repeatable option collects values", () => {
        const cmd = makeCmd([
            { name: "tag", key: "tags", alias: 't', repeatable: true }
        ])
        const [, opts] = parseArgs(cmd, ["--tag=a", "--tag", "b", "-tc"])
        expect(opts.tags).toEqual(["a", "b", "c" ])
    })

    it("-- stops flag parsing", () => {
        const cmd = makeCmd([
            { name: "n", key: "n" }
        ], [
            { name: "file", key: "file" }
        ])
        const [args, opts] = parseArgs(cmd, ["--", "-n", "foo", "readme.md"])
        // After --, "-n" is positional, not an option
        expect(args).toEqual(["-n", "foo", "readme.md"])
        expect(opts.file).toBe("-n") // first positional copied to named arg
        expect(opts.n).toBeUndefined()
    })

    it("copies named positional args into opts", () => {
        const cmd = makeCmd([], [
            { name: "input", key: "input" },
            { name: "output", key: "output" }
        ])
        const [args, opts] = parseArgs(cmd, ["in.txt", "out.txt"])
        expect(args).toEqual(["in.txt", "out.txt"])
        expect(opts.input).toBe("in.txt")
        expect(opts.output).toBe("out.txt")
    })

    it("repeatable positional arg collects remaining", () => {
        const cmd = makeCmd([], [
            { name: "files", key: "files", repeatable: true }
        ])
        const [args, opts] = parseArgs(cmd, ["a.js", "b.js", "c.js"])
        expect(opts.files).toEqual(["a.js", "b.js", "c.js"])
        expect(args).toEqual(["a.js", "b.js", "c.js"])
    })

    it("fills defaults for missing options/args", () => {
        const cmd = makeCmd(
            [
                { name: "mode", key: "mode", defaultValue: "fast" }
            ],
            [
                { name: "dst", key: "dst", defaultValue: "out" }
            ]
        )
        const [, opts] = parseArgs(cmd, [])
        expect(opts.mode).toBe("fast")
        expect(opts.dst).toBe("out")
    })

    it("throws on missing required option", () => {
        const cmd = makeCmd([{ name: "n", required: true }])
        expect(() => parseArgs(cmd, [])).toThrow(/option is required/i)
    })

    it("throws on missing required positional", () => {
        const cmd = makeCmd([], [{ name: "src", required: true }])
        expect(() => parseArgs(cmd, [])).toThrow(/argument is required/i)
    })

    it("coerces when type is provided", () => {
        const cmd = makeCmd(
            [{ name: "count", key: "count", type: OptType.INT }],
            [{ name: "scale", key: "scale", type: OptType.FLOAT }]
        )
        const [args, opts] = parseArgs(cmd, ["--count", "3", "2.5"])
        expect(opts.count).toBe(3)
        expect(args).toEqual([2.5])
        expect(opts.scale).toBe(2.5)
    })
})
