import { describe, expect, it } from 'bun:test'
import { setIntersection, setSymmetricDifference, setUnion } from './set'

describe('setUnion', () => {
  it('merges sets', () => {
    expect(setUnion([1, 2, 3], [3, 4, 5], [5, 6, 7])).toStrictEqual(new Set([1, 2, 3, 4, 5, 6, 7]))
  })
})

describe('setIntersection', () => {
  it('intersects sets', () => {
    expect(setIntersection(new Set([1, 2, 3]), new Set([2, 3, 4]))).toStrictEqual(new Set([2, 3]))
  })
})

describe('setSymmetricDifference', () => {
  it('diffs sets', () => {
    expect(setSymmetricDifference(new Set([1, 2, 3]), new Set([2, 3, 4]))).toStrictEqual(
      new Set([1, 4]),
    )
  })
})
