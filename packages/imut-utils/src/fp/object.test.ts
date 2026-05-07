import { describe, expect, it } from 'bun:test'
import { expectType, type TypeEqual } from '@mpen/ts-types'
import { objSet, relaxedMerge, shallowMerge } from './object'
import { mapSet } from '../fp/map'
import type { Next } from '../resolvable'
import { useState, type Dispatch, type SetStateAction } from '../testing/react'

describe('shallowMerge', () => {
  it('uses expected precedence', () => {
    expect(
      shallowMerge<Record<string, number>>({ b: 2, c: 9 }, { c: 3, d: 4 })({ a: 1, d: 9 }),
    ).toEqual({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    })
  })
  it('infers the object type from a React-style dispatch', () => {
    type State = {
      count: number
      id: string
      status: 'idle' | 'busy'
    }
    const [, setState] = useState<State>({
      count: 1,
      id: 'abc',
      status: 'idle',
    })

    setState(shallowMerge({ status: 'busy' }))
    setState(
      shallowMerge({
        count: 2,
        status: (oldStatus) => {
          expectType<State['status']>(oldStatus)
          return 'busy'
        },
      }),
    )

    expectType<TypeEqual<typeof setState, Dispatch<SetStateAction<State>>>>(true)
  })
  it('allows undefined input', () => {
    expect(relaxedMerge<Record<string, number>>({ b: 2, c: 9 }, { c: 3, d: 4 })(undefined)).toEqual(
      {
        b: 2,
        c: 3,
        d: 4,
      },
    )
  })
  it('returns a concrete object type from relaxedMerge in a setState-style updater', () => {
    type State = {
      count: number
      id: string
    }
    const [, setState] = useState<State | undefined>(undefined)

    setState(
      relaxedMerge({
        id: 'abc',
        count: (count: number | undefined): number => {
          expectType<number | undefined>(count)
          return (count ?? 0) + 1
        },
      }),
    )

    expectType<TypeEqual<typeof setState, Dispatch<SetStateAction<State | undefined>>>>(true)
  })
  it('resolves values in order', () => {
    expect(
      shallowMerge<Record<string, number>>(
        { a: 2, b: (b: number) => b * 2 },
        { a: (a: number) => a + 1, b: (b: number) => b + 1 },
      )({
        a: 1,
        b: 2,
      }),
    ).toEqual({
      a: 2 + 1,
      b: 2 * 2 + 1,
    })
  })
  it('passes key', () => {
    type ObjType = { alpha: string; beta: string; gamma: string }
    const dasherize = (value: string, key: string) => `${key}-${value}`
    expect(
      shallowMerge<ObjType>({ alpha: dasherize, beta: dasherize })({
        alpha: 'a',
        beta: 'b',
        gamma: 'c',
      }),
    ).toEqual({
      alpha: 'alpha-a',
      beta: 'beta-b',
      gamma: 'c',
    })
  })
  it('merge in undefined if you want', () => {
    type ObjType = { alpha: string; beta: string; gamma: string }
    const orig: ObjType = { alpha: 'a', beta: 'b', gamma: 'c' }
    const ret = relaxedMerge<ObjType>(undefined, null)(orig)
    expect(ret).toEqual({
      alpha: 'a',
      beta: 'b',
      gamma: 'c',
    })
    expect(ret).toBe(orig)
  })
  it('default is null', () => {
    type ObjType = { alpha: string; beta: string; gamma: string }
    expect(relaxedMerge<ObjType>({ alpha: 'a', beta: 'b' }, { gamma: 'c' })(null)).toEqual({
      alpha: 'a',
      beta: 'b',
      gamma: 'c',
    })
  })
  it("doesn't mutate", () => {
    type ObjType = { alpha: string; beta: string; gamma: string }
    const orig: ObjType = { alpha: 'a', beta: 'b', gamma: 'c' }
    const ret = shallowMerge<ObjType>({ alpha: 'foo' })(orig)
    expect(orig).toStrictEqual({
      alpha: 'a',
      beta: 'b',
      gamma: 'c',
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
    setState(shallowMerge<State>({ xOffset: 2, yOffset: 3 }))
  })
  it('handles disjunct types', () => {
    type Key = string
    type A = { type: 'A'; a: string }
    type B = { type: 'B'; b: number }
    type Value = A | B
    type Store = { data: Map<Key, Value> }

    const obj: Store = {
      data: new Map([
        [
          'a',
          {
            type: 'A',
            a: 'alpha',
          },
        ],
        [
          'b',
          {
            type: 'B',
            b: 1,
          },
        ],
      ]),
    }

    const result = shallowMerge<Store>({
      data: mapSet<Key, Value>('b', {
        type: 'B',
        b: 2,
      }),
    })(obj)

    expect(result).toEqual({
      data: new Map([
        [
          'a',
          {
            type: 'A',
            a: 'alpha',
          },
        ],
        [
          'b',
          {
            type: 'B',
            b: 2,
          },
        ],
      ]),
    })
  })

  it('merges symbols', () => {
    const s1 = Symbol()
    const s2 = Symbol()
    const s3 = Symbol()

    const result = shallowMerge<any>({
      b: 2,
      [s2]: 'xxx',
      [s3]: 's3',
    })({
      a: 1,
      [s1]: 's1',
      [s2]: 's2',
    })
    expect(result).toEqual({
      a: 1,
      b: 2,
      [s1]: 's1',
      [s2]: 'xxx',
      [s3]: 's3',
    })
  })
})

describe('objSet', () => {
  type Size = {
    width: number
    height: number
  }

  it('basic', () => {
    const oldSize: Size = { width: 512, height: 768 }
    const newSize = objSet<Size>('width', (w) => w + 64)(oldSize)
    expect(newSize).toEqual({
      width: 576,
      height: 768,
    })
    expect(oldSize).toEqual({ width: 512, height: 768 })
    expect(newSize).not.toBe(oldSize)
  })
  it('preserves the object type in a setState-style updater', () => {
    const [, setState] = useState<Size>({ width: 512, height: 768 })

    setState(
      objSet('width', (width) => {
        expectType<number>(width)
        return width + 1
      }),
    )

    expectType<TypeEqual<typeof setState, Dispatch<SetStateAction<Size>>>>(true)
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

    function setState(_state: Next<UsageState>) {}

    const tokensUsed = 100
    const info = {
      id: 'model-id',
      output: 0.01,
    }
    setState(
      shallowMerge<UsageState>({
        usage: objSet(
          info.id,
          shallowMerge<UsageType>({
            output: (o) => (o ?? 0) + tokensUsed,
          }),
        ),
        cost: (c) => c + (tokensUsed / 1000) * info.output,
      }),
    )
  })
})
