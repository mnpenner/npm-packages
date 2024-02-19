import {fpMapDelete, fpMapSet, fpMaybeMapSet, fpMergeMap, mapPush} from './map'
import {arrayDeleteOneValue, fpArrayDeleteOneValue, fpArrayPush, fpArraySelect, fpArrayUnshift} from './array'


describe(fpMapSet.name, () => {
    it('overwrites values', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMapSet<string,number>('b', 3)(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1], ['b', 3]]))
    })
    it('sets new values', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMapSet<string,number>('c', 3)(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1], ['b',2], ['c',3]]))
    })
    it('resolves', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMapSet<string, number>('b', v => (v ?? 0) * 2)(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1], ['b', 4]]))
    })
})

describe(fpMaybeMapSet.name, () => {
    it('sets', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMaybeMapSet<string,number>('b', 3)(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1], ['b', 3]]))
    })
    it('returns nil when given nil', () => {
        expect(fpMaybeMapSet<string,number>('b', 3)(null)).toBe(null)
        expect(fpMaybeMapSet<string,number>('b', 3)(undefined)).toBe(undefined)
    })
    it("doesn't set values that don't already exist", () => {
        expect(fpMaybeMapSet<string,number>('b', 3)(new Map([['a', 1], ['b', 2]]))).toStrictEqual(new Map([['a', 1], ['b', 3]]))
        expect(fpMaybeMapSet<string,number>('c', 3)(new Map([['a', 1], ['b', 2]]))).toStrictEqual(new Map([['a', 1], ['b', 2]]))
    })
    it('resolves', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMaybeMapSet<string, number>('b', v => v * 2)(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1], ['b', 4]]))
    })
})


describe(fpMapDelete.name, () => {
    it('deletes', () => {
        const map = new Map([['a', 1], ['b', 2]])
        const out = fpMapDelete('b')(map)
        expect(out).not.toBe(map)
        expect(out).toStrictEqual(new Map([['a', 1]]))
    })
    it('works with nil map', () => {
        expect(fpMapDelete('a')(null)).toStrictEqual(new Map)
        expect(fpMapDelete('b')(undefined)).toStrictEqual(new Map)

    })
    it("works when doesn't match", () => {
        expect(fpMapDelete('c')(new Map([['a', 1], ['b', 2]]))).toStrictEqual(new Map([['a', 1], ['b', 2]]))
    })
    it("deletes multiple", () => {
        expect(fpMapDelete('a','c')(new Map([['a', 1], ['b', 2], ['c', 2]]))).toStrictEqual(new Map([['b', 2]]))
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

describe(mapPush.name, () => {
    it('works', () => {
        const map = new Map([
            ['a',[]],
            ['b',[2,3]],
        ])
        mapPush(map,'a',1)
        mapPush(map,'b',4,5)
        mapPush(map,'c',6)
        expect(map).toStrictEqual(new Map([
                ['a',[1]],
                ['b',[2,3,4,5]],
                ['c',[6]],
            ])
        )
    })
})
