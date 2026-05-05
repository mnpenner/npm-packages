import { describe, expect, it, test } from 'bun:test'
import { arraySortNumbers, arraySortStrings, arrayPush } from './array'

describe('arraySortNumbers', () => {
  it('sorts ascending', () => {
    const arr = [3, 1, 2, 7, 4, 6, 5]
    const out = arraySortNumbers(arr)
    expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
    expect(out).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it('sorts descending', () => {
    const arr = [3, 1, 2, 7, 4, 6, 5]
    const out = arraySortNumbers(arr, false)
    expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
    expect(out).toStrictEqual([7, 6, 5, 4, 3, 2, 1])
  })
})

describe('arraySortStrings', () => {
  it('sorts alphabetically', () => {
    const arr = ['alpha', 'charlie', 'beta']
    const out = arraySortStrings(arr)
    expect(arr).toStrictEqual(['alpha', 'charlie', 'beta'])
    expect(out).toStrictEqual(['alpha', 'beta', 'charlie'])
  })
  it('sorts case-insensitive', () => {
    expect(arraySortStrings(['AA', 'ab', 'aa'])).toStrictEqual(['AA', 'aa', 'ab'])
  })
  it('sorts numbers', () => {
    expect(arraySortStrings(['a2', 'a10', 'a1'])).toStrictEqual(['a1', 'a2', 'a10'])
  })
  it('sorts descending', () => {
    expect(arraySortStrings(['c', 'ab', 'b', 'aa'], { ascending: false })).toStrictEqual([
      'c',
      'b',
      'ab',
      'aa',
    ])
  })
})

test('arrayPush', () => {
  expect(arrayPush([1], 2)).toEqual([1, 2])
})
