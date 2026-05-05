import { describe, expect, it, test } from 'bun:test'
import {
  arrayDeleteIndex,
  arrayDeleteOneValue,
  arrayDeleteValue,
  arrayFindAndReplace,
  arrayInsert,
  arrayInsertSorted,
  arrayPop,
  arrayPush,
  arrayReject,
  arraySelect,
  arraySplice,
  arrayUnshift,
} from './array'

test('arrayPush', () => {
  const arr = [3, 1, 2, 7, 4, 6, 5]
  const out = arrayPush(1, 5, 3)(arr)
  expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
  expect(out).toStrictEqual([3, 1, 2, 7, 4, 6, 5, 1, 5, 3])
})

describe('arrayPop', () => {
  it('takes 0 args', () => {
    expect(arrayPop()([1, 2, 3])).toStrictEqual([1, 2])
  })
  it('throws on bad input', () => {
    expect(() => arrayPop(-1)([1, 2, 3])).toThrow()
    expect(() => arrayPop(3.14)([1, 2, 3])).toThrow()
  })
  it('pops multiple', () => {
    expect(arrayPop(0)([1, 2, 3])).toStrictEqual([1, 2, 3])
    expect(arrayPop(1)([1, 2, 3])).toStrictEqual([1, 2])
    expect(arrayPop(2)([1, 2, 3])).toStrictEqual([1])
    expect(arrayPop(3)([1, 2, 3])).toStrictEqual([])
    expect(arrayPop(4)([1, 2, 3])).toStrictEqual([])
  })
  it('handles nil', () => {
    expect(arrayPop()([])).toStrictEqual([])
    expect(arrayPop()(null)).toStrictEqual([])
    expect(arrayPop()(undefined)).toStrictEqual([])
  })
})

test('arrayUnshift', () => {
  const arr = [3, 1, 2, 7, 4, 6, 5]
  const out = arrayUnshift(1, 5, 3)(arr)
  expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
  expect(out).toStrictEqual([1, 5, 3, 3, 1, 2, 7, 4, 6, 5])
})

test('arrayInsert', () => {
  expect(arrayInsert(0, 99)([1, 3, 5])).toStrictEqual([99, 1, 3, 5])
  expect(arrayInsert(1, 99)([1, 3, 5])).toStrictEqual([1, 99, 3, 5])
  expect(arrayInsert(9, 99)([1, 3, 5])).toStrictEqual([1, 3, 5, 99])
  expect(arrayInsert(2, 77, 88, 99)([1, 3, 5])).toStrictEqual([1, 3, 77, 88, 99, 5])
  expect(arrayInsert(2)([1, 3, 5])).toStrictEqual([1, 3, 5])
})

test('arrayInsertSorted', () => {
  expect(arrayInsertSorted(6, 2, 4)([1, 3, 5, 7])).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
  expect(arrayInsertSorted(9, -9)([1, 3, 5, 7])).toStrictEqual([-9, 1, 3, 5, 7, 9])
  expect(arrayInsertSorted(3, 5)([1, 3, 5, 7])).toStrictEqual([1, 3, 3, 5, 5, 7])
})

test('arrayDeleteIndex', () => {
  const arr = [3, 1, 2, 7, 4, 6, 5]
  const out = arrayDeleteIndex(1, 5, 3)(arr)
  expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
  expect(out).toStrictEqual([3, 2, 4, 5])
})

describe('arraySelect', () => {
  it('basic', () => {
    const arr = [3, 1, 2, 7, 4, 6, 5]
    const out = arraySelect<number>((v, i) => v > 5 || i === 0)(arr)
    expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
    expect(out).toStrictEqual([3, 7, 6])
  })
  it('more', () => {
    expect(arraySelect<number>((n) => n % 2 === 0)([1, 2, 3, 4, 5, 6])).toEqual([2, 4, 6])
    expect(arraySelect<number>((n) => n % 2 === 0, 2)([1, 2, 3, 4, 5, 6])).toEqual([2, 4])
    expect(arraySelect<number>((n) => n % 2 === 0, 0)([1, 2, 3, 4, 5, 6])).toEqual([])
  })
})

describe('arrayReject', () => {
  it('basic', () => {
    const arr = [3, 1, 2, 7, 4, 6, 5]
    const out = arrayReject<number>((v, i) => v > 5 || i === 0)(arr)
    expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
    expect(out).toStrictEqual([1, 2, 4, 5])
  })
  it('more', () => {
    expect(arrayReject<number>((n) => n % 2 === 0)([1, 2, 3, 4, 5, 6])).toEqual([1, 3, 5])
    expect(arrayReject<number>((n) => n % 2 === 0, 2)([1, 2, 3, 4, 5, 6])).toEqual([1, 3, 5, 6])
    expect(arrayReject<number>((n) => n % 2 === 0, 0)([1, 2, 3, 4, 5, 6])).toEqual([
      1, 2, 3, 4, 5, 6,
    ])
  })
})

test('arrayDeleteValue', () => {
  expect(arrayDeleteValue<number>(2, true)([1, 2, 1, 2])).toEqual([1, 1])
  expect(arrayDeleteValue<number>(2, false)([1, 2, 1, 2])).toEqual([1, 1])
  expect(arrayDeleteValue<number | string>('2', false)([1, 2, 1, 2])).toEqual([1, 1])
  expect(arrayDeleteValue<number>(2, true, 1)([1, 2, 1, 2])).toEqual([1, 1, 2])
  expect(arrayDeleteValue<number>(1, false, 2)([1, 2, 1, 2, 1, 2])).toEqual([2, 2, 1, 2])
})

describe('arrayDeleteOneValue', () => {
  it('deletes one value', () => {
    const arr = [1, 9, 2, 9, 3]
    const out = arrayDeleteOneValue<number>(9, false)(arr)
    expect(arr).toStrictEqual([1, 9, 2, 9, 3])
    expect(out).toStrictEqual([1, 2, 9, 3])
  })
  it('performs loose comparison', () => {
    const arr = [1, '2', 2, '3']
    const out = arrayDeleteOneValue<string | number>(2, false)(arr)
    expect(arr).toStrictEqual([1, '2', 2, '3'])
    expect(out).toStrictEqual([1, 2, '3'])
  })
  it('performs strict comparison', () => {
    const arr = [1, '2', 2, '3']
    const out = arrayDeleteOneValue<string | number>(2, true)(arr)
    expect(arr).toStrictEqual([1, '2', 2, '3'])
    expect(out).toStrictEqual([1, '2', '3'])
  })
  it('no match', () => {
    const arr = [1, 9, 2, 9, 3]
    const out = arrayDeleteOneValue<number>(10, false)(arr)
    expect(arr).toStrictEqual([1, 9, 2, 9, 3])
    expect(out).toStrictEqual([1, 9, 2, 9, 3])
  })
})

test('arrayFindAndReplace', () => {
  expect(arrayFindAndReplace<number>((x) => x === 5, 3)([1, 2, 5, 4])).toEqual([1, 2, 3, 4])
  expect(arrayFindAndReplace<number>((x) => x === 6, 3)([1, 2, 5, 4])).toEqual([1, 2, 5, 4])
  expect(
    arrayFindAndReplace<number>(
      (x) => x === 5,
      (x) => x * 2,
    )([1, 2, 5, 4]),
  ).toEqual([1, 2, 10, 4])
})

test('arraySplice', () => {
  expect(arraySplice(2)([1, 2, 3, 4])).toEqual([1, 2, 4])
  expect(arraySplice(2, 2)([1, 2, 3, 4])).toEqual([1, 2])
  expect(arraySplice(2, 1, 7, 8, 9)([1, 2, 3, 4])).toEqual([1, 2, 7, 8, 9, 4])
  expect(arraySplice(1, 0, 9)([1, 2, 3, 4])).toEqual([1, 9, 2, 3, 4])
  expect(arraySplice(0, 0, 9)([1, 2, 3, 4])).toEqual([9, 1, 2, 3, 4])
  expect(arraySplice(9, 0, 9)([1, 2, 3, 4])).toEqual([1, 2, 3, 4, 9])
})
