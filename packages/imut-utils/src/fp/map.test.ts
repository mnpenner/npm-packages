import { describe, expect, it } from 'bun:test'
import { mapDelete, mapSet, mapUpdate, mergeMap } from './map'
import { arrayDeleteOneValue, arrayPush, arraySelect, arrayUnshift } from '../fp/array'

describe('mapSet', () => {
  it('overwrites values', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const out = mapSet<string, number>('b', 3)(map)
    expect(out).not.toBe(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 3],
      ]),
    )
  })
  it('sets new values', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const out = mapSet<string, number>('c', 3)(map)
    expect(out).not.toBe(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
    )
  })
  it('resolves', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const out = mapSet<string, number>('b', (v) => (v ?? 0) * 2)(map)
    expect(out).not.toBe(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 4],
      ]),
    )
  })
})

describe('mapUpdate', () => {
  it('sets', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const out = mapUpdate<string, number>('b', 3)(map)
    expect(out).not.toBe(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 3],
      ]),
    )
  })
  it("doesn't set values that don't already exist", () => {
    expect(
      mapUpdate<string, number>(
        'b',
        3,
      )(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      ),
    ).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 3],
      ]),
    )
    expect(
      mapUpdate<string, number>(
        'c',
        3,
      )(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      ),
    ).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
    )
  })
  it('resolves', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const out = mapUpdate<string, number>('b', (v) => v * 2)(map)
    expect(out).not.toBe(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 4],
      ]),
    )
  })
})

describe('mapDelete', () => {
  it('deletes', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const out = mapDelete('b')(map)
    expect(out).not.toBe(map)
    expect(out).toStrictEqual(new Map([['a', 1]]))
  })
  it('works with nil map', () => {
    expect(mapDelete('a')(null)).toStrictEqual(new Map())
    expect(mapDelete('b')(undefined)).toStrictEqual(new Map())
  })
  it("works when doesn't match", () => {
    expect(
      mapDelete('c')(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      ),
    ).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
    )
  })
  it('deletes multiple', () => {
    expect(
      mapDelete(
        'a',
        'c',
      )(
        new Map([
          ['a', 1],
          ['b', 2],
          ['c', 2],
        ]),
      ),
    ).toStrictEqual(new Map([['b', 2]]))
  })
})

describe('mergeMap', () => {
  it('merges', () => {
    const map1 = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const map2 = new Map([
      ['b', 3],
      ['c', 4],
    ])
    const out = mergeMap(map2)(map1)
    expect(out).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 3],
        ['c', 4],
      ]),
    )
  })
  it('resolves', () => {
    const map = new Map([
      ['a', 1],
      ['b', 2],
    ])
    const out = mergeMap<string, number>((m) => [
      ['b', (v) => (v ?? 0) * 2],
      ['a', (m.get('b') ?? 0) * 3],
    ])(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', 6],
        ['b', 4],
      ]),
    )
  })
  it('combo', () => {
    const map = new Map([
      ['a', []],
      ['b', [2, 3]],
      ['d', [4, 5, 6]],
    ])
    const out = mergeMap<string, number[]>([
      ['a', arrayPush(1)],
      ['b', arrayDeleteOneValue(3, true)],
      ['c', arrayUnshift(3, 4)],
      ['d', arraySelect((v) => v > 4)],
    ])(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', [1]],
        ['b', [2]],
        ['c', [3, 4]],
        ['d', [5, 6]],
      ]),
    )
  })
  it('passes key', () => {
    const setValueToKey = (value: string | undefined, key: string) => `${key}-${value}`
    const map = new Map([
      ['a', 'alpha'],
      ['b', 'beta'],
    ])
    const out = mergeMap<string, string>((_m) => [
      ['a', setValueToKey],
      ['b', setValueToKey],
      ['c', setValueToKey],
    ])(map)
    expect(out).toStrictEqual(
      new Map([
        ['a', 'a-alpha'],
        ['b', 'b-beta'],
        ['c', 'c-undefined'],
      ]),
    )
  })
})
