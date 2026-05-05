import { describe, expect, it } from 'bun:test'
import { setAdd, setCheck, setRemove } from './set'

describe('setCheck', () => {
  it('adds', () => {
    const set = new Set([1, 2, 3])
    const out = setCheck(4, true)(set)
    expect(set).toStrictEqual(new Set([1, 2, 3]))
    expect(out).toStrictEqual(new Set([1, 2, 3, 4]))
  })
  it('removes', () => {
    const set = new Set([1, 2, 3])
    const out = setCheck(2, false)(set)
    expect(set).toStrictEqual(new Set([1, 2, 3]))
    expect(out).toStrictEqual(new Set([1, 3]))
  })
})

describe('setAdd', () => {
  it('adds multiple', () => {
    const set = new Set([1, 2, 3])
    const out = setAdd(3, 4, 5)(set)
    expect(set).toStrictEqual(new Set([1, 2, 3]))
    expect(out).toStrictEqual(new Set([1, 2, 3, 4, 5]))
  })
})

describe('setRemove', () => {
  it('removes multiple', () => {
    const set = new Set([1, 2, 3])
    const out = setRemove(1, 3, 4)(set)
    expect(set).toStrictEqual(new Set([1, 2, 3]))
    expect(out).toStrictEqual(new Set([2]))
  })
})
