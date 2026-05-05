import { describe, expect, it } from 'bun:test'
import { mapPush } from './map'

describe('mapPush', () => {
  it('works', () => {
    const map = new Map([
      ['a', []],
      ['b', [2, 3]],
    ])
    mapPush(map, 'a', 1)
    mapPush(map, 'b', 4, 5)
    mapPush(map, 'c', 6)
    expect(map).toStrictEqual(
      new Map([
        ['a', [1]],
        ['b', [2, 3, 4, 5]],
        ['c', [6]],
      ]),
    )
  })
})
