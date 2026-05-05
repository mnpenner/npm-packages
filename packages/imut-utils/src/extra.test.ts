import { describe, expect, it, test } from 'bun:test'
import { binarySearch } from './extra'

describe(binarySearch.name, () => {
  it('finds matches', () => {
    const arr = [1, 3, 5, 7, 9, 11]
    expect(binarySearch(arr, 5)).toStrictEqual(2)
    expect(binarySearch(arr, 1)).toStrictEqual(0)
    expect(binarySearch(arr, 11)).toStrictEqual(5)
  })
  it('gives insert position', () => {
    const arr = [1, 3, 5, 7, 9, 11]
    expect(binarySearch(arr, 2)).toStrictEqual(~1)
    expect(binarySearch(arr, 0)).toStrictEqual(~0)
    expect(binarySearch(arr, 99)).toStrictEqual(~6)
  })
})

import { arrayCreate, mapToArray, setToArray, assert } from './extra'

test('arrayCreate', () => {
  expect(arrayCreate(3, 'a')).toEqual(['a', 'a', 'a'])
  expect(arrayCreate(3, (i) => i)).toEqual([0, 1, 2])
})

test('mapToArray', () => {
  const map = new Map([
    ['a', 1],
    ['b', 2],
  ])
  expect(mapToArray(map, (v, k, i) => `${k}${v}${i}`)).toEqual(['a10', 'b21'])
})

test('setToArray', () => {
  const set = new Set([1, 2, 3])
  expect(setToArray(set, (v, i) => v * 2 + i)).toEqual([2, 5, 8])
})

describe('assert', () => {
  it('does nothing on true', () => {
    expect(() => assert(true)).not.toThrow()
  })
  it('throws on false', () => {
    expect(() => assert(false)).toThrow('Assertion failed')
  })
})
