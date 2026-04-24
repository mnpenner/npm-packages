import {fpObjSet, fpRelaxedMerge, fpShallowMerge} from './object'
import {fpMapSet} from './map'
import {Next} from './resolvable'


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
        expect(fpRelaxedMerge<Record<string, number>>({b: 2, c: 9}, {c: 3, d: 4})(undefined)).toEqual({
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
            a: 2 + 1,
            b: 2 * 2 + 1,
        })
    })
    it('passes key', () => {
        type ObjType = { alpha: string, beta: string, gamma: string }
        const dasherize = (value: string, key: string) => `${key}-${value}`
        expect(fpShallowMerge<ObjType>({alpha: dasherize, beta: dasherize})({
            alpha: 'a',
            beta: 'b',
            gamma: 'c',
        })).toEqual({
            alpha: 'alpha-a',
            beta: 'beta-b',
            gamma: 'c',
        })
    })
    it('merge in undefined if you want', () => {
        type ObjType = { alpha: string, beta: string, gamma: string }
        const orig: ObjType = {alpha: 'a', beta: 'b', gamma: 'c'}
        const ret = fpRelaxedMerge<ObjType>(undefined, null)(orig)
        expect(ret).toEqual({
            alpha: 'a',
            beta: 'b',
            gamma: 'c'
        })
        expect(ret).toBe(orig)
    })
    it('default is null', () => {
        type ObjType = { alpha: string, beta: string, gamma: string }
        expect(fpRelaxedMerge<ObjType>({alpha: 'a', beta: 'b'}, {gamma: 'c'})(null)).toEqual({
            alpha: 'a',
            beta: 'b',
            gamma: 'c'
        })
    })
    it("doesn't mutate", () => {
        type ObjType = { alpha: string, beta: string, gamma: string }
        const orig: ObjType = {alpha: 'a', beta: 'b', gamma: 'c'}
        const ret = fpShallowMerge<ObjType>({alpha: 'foo'})(orig)
        expect(orig).toStrictEqual({
            alpha: 'a',
            beta: 'b',
            gamma: 'c'
        })
        expect(ret).not.toBe(orig)
    })
    it('chills out', () => {
        type State = {
            scale: number
            xOffset: number
            yOffset: number
        }
        let state: State = {
            scale: 0,
            xOffset: 0,
            yOffset: 0,
        }
        const setState = (fn: (prev: State) => State) => {
            state = fn(state)
        }
        // I can't get this to work without explicitly setting the <Type>
        // https://stackoverflow.com/questions/75432863/how-to-get-typescript-to-infer-type-from-the-function-its-being-passed-to
        setState(fpShallowMerge<State>({xOffset: 2, yOffset: 3}))
    })
    it('handles disjunct types', () => {
        type Key = string
        type A = { type: 'A', a: string }
        type B = { type: 'B', b: number }
        type Value = A | B
        type Store = { data: Map<Key, Value> }

        const obj: Store = {
            data: new Map([['a', {
                type: 'A',
                a: 'alpha',
            }], ['b', {
                type: 'B',
                b: 1,
            }]])
        }

        const result = fpShallowMerge<Store>({
            data: fpMapSet<Key, Value>('b', {
                type: 'B',
                b: 2,
            })
        })(obj)

        expect(result).toEqual({
            data: new Map([['a', {
                type: 'A',
                a: 'alpha',
            }], ['b', {
                type: 'B',
                b: 2,
            }]])
        })
    })

    it('merges symbols', () => {
        const s1 = Symbol()
        const s2 = Symbol()
        const s3 = Symbol()

        const result = fpShallowMerge<any>({
                b: 2,
                [s2]: 'xxx',
                [s3]: 's3'
            }
        )({
                a: 1,
                [s1]: 's1',
                [s2]: 's2',
            }
        )
        expect(result).toEqual({
            a: 1,
            b: 2,
            [s1]: 's1',
            [s2]: 'xxx',
            [s3]: 's3'
        })
    })
})


describe(fpObjSet.name, () => {
    type Size = {
        width: number
        height: number
    }

    it('basic', () => {
        const oldSize: Size = {width: 512, height: 768}
        const newSize = fpObjSet<Size>('width', w => w + 64)(oldSize)
        expect(newSize).toEqual({
            width: 576,
            height: 768
        })
        expect(oldSize).toEqual({width: 512, height: 768})
        expect(newSize).not.toBe(oldSize)
    })
    it('nested', () => {
        type UsageType = {
            input: number
            output: number
        }
        type UsageState = {
            usage: Record<string, UsageType>
            cost: number
        }

        function setState(state: Next<UsageState>) {
        }

        const tokensUsed = 100
        const info = {
            id: 'model-id',
            output: 0.0100,
        }
        setState(fpShallowMerge<UsageState>({
            usage: fpObjSet(info.id, fpShallowMerge<UsageType>({
                output: o => (o ?? 0) + tokensUsed,
            })),
            cost: c => c + tokensUsed / 1000 * info.output,
        }))
    })
    // it('creates objects', () => {
    //     const newSize = fpObjSet<Size>('width', 128)(null)
    //     expect(newSize).toEqual({
    //         width: 128,
    //     })
    // })
})
