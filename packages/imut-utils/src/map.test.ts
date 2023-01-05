import {fpMapSet, fpMergeMap} from './map'
import {arrayDeleteOneValue, fpArrayDeleteOneValue, fpArrayPush, fpArraySelect, fpArrayUnshift} from './array'


describe(fpMapSet.name, () => {
    it('sets', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMapSet('b', 3)(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1], ['b', 3]]))
    })
    it('resolves', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMapSet<string, number>('b', v => (v ?? 0) * 2)(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1], ['b', 4]]))
    })
})

describe(fpMergeMap.name, () => {
    it('merges', () => {
        const map1 = new Map([['a', 1], ['b', 2]])
        const map2 = new Map([['b', 3], ['c', 4]])
        const out = fpMergeMap(map2)(map1)
        expect(out).toStrictEqual(new Map([['a', 1], ['b', 3], ['c', 4]]))
    })
    it('resolves', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMergeMap<string, number>(m => [
            ['b', v => (v ?? 0) * 2],
            ['a', (m.get('b') ?? 0) * 3],
        ])(map)
        expect(out).toStrictEqual(new Map([['a', 6], ['b', 4]]))
    })
    it('combo', () => {
        const map = new Map([
            ['a', []],
            ['b', [2,3]],
            ['d', [4,5,6]],
        ])
        const out = fpMergeMap<string, number[]>([
            ['a',fpArrayPush(1)],
            ['b',fpArrayDeleteOneValue(3,true)],
            ['c',fpArrayUnshift(3,4)],
            ['d',fpArraySelect(v => v>4)],
        ])(map)
        expect(out).toStrictEqual(new Map([
            ['a', [1]],
            ['b', [2]],
            ['c', [3,4]],
            ['d', [5,6]],
        ]))
    })
    it('passes key', () => {
        const setValueToKey = (value: string|undefined, key: string) => `${key}-${value}`
        const map = new Map([['a', 'alpha'], ['b', 'beta']])
        const out = fpMergeMap<string, string>(m => [
            ['a', setValueToKey],
            ['b', setValueToKey],
            ['c', setValueToKey],
        ])(map)
        expect(out).toStrictEqual(new Map([['a', 'a-alpha'], ['b', 'b-beta'],['c','c-undefined']]))
    })
})
