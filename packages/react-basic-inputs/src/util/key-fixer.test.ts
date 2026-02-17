import {describe, expect, it} from 'bun:test'
import {KeyFixer} from './key-fixer.ts'


describe('keyfixer', () => {
    it('dedupes', () => {
        const fixer = new KeyFixer()
        expect(fixer.fix({value: 1}, 0)).toBe("1")
        expect(fixer.fix({value: 1}, 1)).toBe("1(2)")
        expect(fixer.fix({value: 1}, 2)).toBe("1(3)")
    })
    it('works on symbols', () => {
        const fixer = new KeyFixer()
        const s = Symbol()
        expect(fixer.fix({value: s}, 0)).toBe("0")
        expect(fixer.fix({value: s}, 1)).toBe("1")
        expect(fixer.fix({value: s}, 2)).toBe("2")
    })
    it('works on strings', () => {
        const fixer = new KeyFixer()
        expect(fixer.fix({value: "a"}, 0)).toBe("a")
        expect(fixer.fix({value: "b"}, 1)).toBe("b")
        expect(fixer.fix({value: "a"}, 2)).toBe("a(2)")
    })
    it('works on arrays', () => {
        const fixer = new KeyFixer()
        expect(fixer.fix({value: []}, 0)).toBe("[]")
        expect(fixer.fix({value: [1]}, 1)).toBe("[1]")
        expect(fixer.fix({value: [2]}, 2)).toBe("[2]")
        expect(fixer.fix({value: [2]}, 3)).toBe("[2](2)")
    })
    it('allows custom key', () => {
        const fixer = new KeyFixer<number>()
        expect(fixer.fix({value: 1, uniqueKey: "sym"}, 0)).toBe("sym")
        expect(fixer.fix({value: 1, uniqueKey: (_o, i) => String(i * 2)}, 2)).toBe("4")
    })
})
