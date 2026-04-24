#!bun test
import {describe, expect, test} from "bun:test"
import {cc} from "./classcat"
import vm from "node:vm"

describe("classcat", () => {
    test("nothing, null, undefined", () => {
        expect(cc()).toBe("")
        expect(cc(null)).toBe("")
        expect(cc(undefined)).toBe("")
        // eslint-disable-next-line no-sparse-arrays
        expect(cc([, , , null, undefined])).toBe("")
    })

    test("empty objects", () => {
        expect(cc({})).toBe("")
        expect(cc([])).toBe("")
        expect(cc([{}])).toBe("")
        expect(cc([{}, {}, {}])).toBe("")
    })

    test("booleans", () => {
        expect(cc(false)).toBe("")
        expect(cc([true, false])).toBe("")
    })

    test("numbers", () => {
        expect(cc(0)).toBe("0")
        expect(cc([0, 1])).toBe("0 1")
        expect(cc({0: true, 1: true})).toBe("0 1")
    })

    test("empty strings", () => {
        expect(cc("")).toBe("")
        expect(
            cc({
                elf: "",
                orc: "",
                gnome: "",
            })
        ).toBe("")
        expect(cc(["", "", ""])).toBe("")
    })

    test("arrays of strings", () => {
        expect(cc(["elf", "orc", false, "gnome"])).toBe("elf orc gnome")
    })

    test("array of arrays", () => {
        expect(cc(["elf", ["orc", [false, "gnome"]]])).toBe("elf orc gnome")
    })

    test("object of key:string pairs", () => {
        expect(
            cc({
                elf: true,
                orc: true,
                dodo: false,
                gnome: true,
            })
        ).toBe("elf orc gnome")
    })

    test("array of objects and arrays", () => {
        expect(
            cc([
                "elf",
                "half-orc",
                {
                    "half-elf": true,
                },
                ["gnome", "goblin", "dwarf"],
            ])
        ).toBe("elf half-orc half-elf gnome goblin dwarf")
    })

    // Additional tests
    test("keeps object keys with truthy values", () => {
        expect(
            cc({
                a: true,
                b: false,
                c: 0,
                d: null,
                e: undefined,
                f: 1,
            })
        ).toBe("a f")
    })

    test("joins arrays of class names and ignores falsy values", () => {
        expect(cc(["a", 0, null, undefined, false, "b"])).toBe("a 0 b")
    })

    test("supports heterogeneous arguments", () => {
        expect(cc([{a: true}, "b", 0])).toBe("a b 0")
    })

    test("should be trimmed", () => {
        expect(cc(["", "b", {}, ""])).toBe("b")
    })

    test("returns an empty string for an empty configuration", () => {
        expect(cc({})).toBe("")
    })

    test("supports an array of class names", () => {
        expect(cc(["a", "b"])).toBe("a b")
    })

    test("joins array arguments with string arguments", () => {
        expect(cc([["a", "b"], "c"])).toBe("a b c")
        expect(cc(["c", ["a", "b"]])).toBe("c a b")
    })

    test("handles multiple array arguments", () => {
        expect(cc([["a", "b"], ["c", "d"]])).toBe("a b c d")
    })

    test("handles arrays that include falsy and true values", () => {
        expect(cc(["a", 0, null, undefined, false, true, "b"])).toBe("a 0 b")
    })

    test("handles arrays that include arrays", () => {
        expect(cc(["a", ["b", "c"]])).toBe("a b c")
    })

    test("handles arrays that include objects", () => {
        expect(cc(["a", {b: true, c: false}])).toBe("a b")
    })

    test("handles deep array recursion", () => {
        expect(cc(["a", ["b", ["c", {d: true}]]])).toBe("a b c d")
    })

    test("handles arrays that are empty", () => {
        expect(cc(["a", []])).toBe("a")
    })

    test("handles nested arrays that have empty nested arrays", () => {
        expect(cc(["a", [[]]])).toBe("a")
    })

    test("handles all types of truthy and falsy property values as expected", () => {
        expect(
            cc({
                // falsy:
                null: null,
                emptyString: "",
                noNumber: NaN,
                zero: 0,
                negativeZero: -0,
                false: false,
                undefined: undefined,

                // truthy:
                nonEmptyString: "foobar",
                whitespace: " ",
                function: Object.prototype.toString,
                emptyObject: {},
                nonEmptyObject: {a: 1, b: 2},
                emptyList: [],
                nonEmptyList: [1, 2, 3],
                greaterZero: 1,
            })
        ).toBe("nonEmptyString whitespace function emptyObject nonEmptyObject emptyList nonEmptyList greaterZero")
    })

    test('accepts multiple arguments', () => {
        expect(cc('a', 'b', false, 'c')).toBe('a b c')
    })

    test("handles objects in a VM", () => {
        const context = {cc, output: ''}
        vm.createContext(context)

        const code = 'output = cc({ a: true, b: true });'

        vm.runInContext(code, context)
        expect(context.output).toBe("a b")
    })
})
