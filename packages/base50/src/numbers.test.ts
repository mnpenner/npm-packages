import {describe, expect, it} from 'bun:test'
import {base50ToNumber, numberToBase50} from './numbers'


describe('numToBase', () => {
    it('non-negative numbers', () => {
        expect(numberToBase50(0)).toBe('0')
        expect(numberToBase50(1)).toBe('1')
        expect(numberToBase50(49)).toBe('Z')
        expect(numberToBase50(50)).toBe('10')
        expect(numberToBase50(100)).toBe('20')
        expect(numberToBase50(499)).toBe('9Z')
        expect(numberToBase50(500)).toBe('b0')
        expect(numberToBase50(2500)).toBe('100')
        expect(numberToBase50(Number.MAX_SAFE_INTEGER)).toBe('4BzbKBKVmP')
    })
    it('negative numbers', () => {
        expect(numberToBase50(-0)).toBe('-0')
        expect(numberToBase50(-1)).toBe('-1')
        expect(numberToBase50(-49)).toBe('-Z')
        expect(numberToBase50(-50)).toBe('-10')
        expect(numberToBase50(-100)).toBe('-20')
        expect(numberToBase50(-499)).toBe('-9Z')
        expect(numberToBase50(-500)).toBe('-b0')
        expect(numberToBase50(-2500)).toBe('-100')
        expect(numberToBase50(Number.MIN_SAFE_INTEGER)).toBe('-4BzbKBKVmP')
    })
})

describe('base50ToNumber', () => {
    it('non-negative numbers', () => {
        expect(base50ToNumber('0')).toBe(0)
        expect(base50ToNumber('1')).toBe(1)
        expect(base50ToNumber('Z')).toBe(49)
        expect(base50ToNumber('10')).toBe(50)
        expect(base50ToNumber('20')).toBe(100)
        expect(base50ToNumber('9Z')).toBe(499)
        expect(base50ToNumber('b0')).toBe(500)
        expect(base50ToNumber('100')).toBe(2500)
        expect(base50ToNumber('4BzbKBKVmP')).toBe(Number.MAX_SAFE_INTEGER)
    })
    it('negative numbers', () => {
        expect(base50ToNumber('-0')).toBe(-0)
        expect(base50ToNumber('-1')).toBe(-1)
        expect(base50ToNumber('-Z')).toBe(-49)
        expect(base50ToNumber('-10')).toBe(-50)
        expect(base50ToNumber('-20')).toBe(-100)
        expect(base50ToNumber('-9Z')).toBe(-499)
        expect(base50ToNumber('-b0')).toBe(-500)
        expect(base50ToNumber('-100')).toBe(-2500)
        expect(base50ToNumber('-4BzbKBKVmP')).toBe(Number.MIN_SAFE_INTEGER)
    })
})
