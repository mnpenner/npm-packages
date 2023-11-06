import {describe, expect, it} from 'bun:test'
import {base50to10, base10to50} from './numbers'


describe('numToBase', () => {
    it('non-negative numbers', () => {
        expect(base10to50(0)).toBe('0')
        expect(base10to50(1)).toBe('1')
        expect(base10to50(49)).toBe('Z')
        expect(base10to50(50)).toBe('10')
        expect(base10to50(100)).toBe('20')
        expect(base10to50(499)).toBe('9Z')
        expect(base10to50(500)).toBe('b0')
        expect(base10to50(2500)).toBe('100')
        expect(base10to50(Number.MAX_SAFE_INTEGER)).toBe('4BzbKBKVmP')
    })
    it('negative numbers', () => {
        expect(base10to50(-0)).toBe('-0')
        expect(base10to50(-1)).toBe('-1')
        expect(base10to50(-49)).toBe('-Z')
        expect(base10to50(-50)).toBe('-10')
        expect(base10to50(-100)).toBe('-20')
        expect(base10to50(-499)).toBe('-9Z')
        expect(base10to50(-500)).toBe('-b0')
        expect(base10to50(-2500)).toBe('-100')
        expect(base10to50(Number.MIN_SAFE_INTEGER)).toBe('-4BzbKBKVmP')
    })
})

describe('base50ToNumber', () => {
    it('non-negative numbers', () => {
        expect(base50to10('0')).toBe(0)
        expect(base50to10('1')).toBe(1)
        expect(base50to10('Z')).toBe(49)
        expect(base50to10('10')).toBe(50)
        expect(base50to10('20')).toBe(100)
        expect(base50to10('9Z')).toBe(499)
        expect(base50to10('b0')).toBe(500)
        expect(base50to10('100')).toBe(2500)
        expect(base50to10('4BzbKBKVmP')).toBe(Number.MAX_SAFE_INTEGER)
    })
    it('negative numbers', () => {
        expect(base50to10('-0')).toBe(-0)
        expect(base50to10('-1')).toBe(-1)
        expect(base50to10('-Z')).toBe(-49)
        expect(base50to10('-10')).toBe(-50)
        expect(base50to10('-20')).toBe(-100)
        expect(base50to10('-9Z')).toBe(-499)
        expect(base50to10('-b0')).toBe(-500)
        expect(base50to10('-100')).toBe(-2500)
        expect(base50to10('-4BzbKBKVmP')).toBe(Number.MIN_SAFE_INTEGER)
    })
})
