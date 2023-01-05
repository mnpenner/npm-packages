import {fpShallowMerge} from './object'

describe(fpShallowMerge.name, () => {
    it('uses expected precedence', () => {
        expect(fpShallowMerge<Record<string, number>>({b: 2, c: 9}, {c: 3, d: 4})({a: 1, d: 9})).toEqual({
            a: 1,
            b: 2,
            c: 3,
            d: 4,
        })
    })
    it('allows undefined input', () => {
        expect(fpShallowMerge<Record<string, number> | undefined>({b: 2, c: 9}, {c: 3, d: 4})(undefined)).toEqual({
            b: 2,
            c: 3,
            d: 4,
        })
    })
    it('resolves values in order', () => {
        expect(fpShallowMerge<Record<string, number>>({a: 2, b: b => b * 2}, {a: a => a + 1, b: b => b + 1})({
            a: 1,
            b: 2
        })).toEqual({
            a: 2+1,
            b: 2*2+1,
        })
    })
})
