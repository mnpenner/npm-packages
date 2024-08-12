import {describe, expect, it} from 'bun:test'
import {bufToBase50, chunk6bits} from './buffer'


describe('chunk6bits', () => {
    it('works', () => {
        expect([...chunk6bits([0b1100_0011])])
            .toEqual([0b110000, 0b110000])
        expect([...chunk6bits([0b1100_0011, 0b1100_0011])])
            .toEqual([0b110000, 0b111100, 0b001100])
        expect([...chunk6bits([0b1100_0011, 0b1100_0011, 0b1100_0011])])
            .toEqual([0b110000, 0b111100, 0b001111, 0b000011])
        expect([...chunk6bits([0b1100_0011, 0b1100_0011, 0b1100_0011, 0b0101_1010])])
            .toEqual([0b1100_00, 0b1111_00, 0b0011_11, 0b0000_11, 0b0101_10, 0b1000_00])
        expect([...chunk6bits([])])
            .toEqual([])
    })
})

describe('bufToBase50', () => {
    it('works', () => {
        // expect(bufToBase50([0b0000_0000])).toBe('00')
        // expect(bufToBase50([0b0000_0100])).toBe('10') // not going to work because the 6th bit is shared with the next chunk...
        expect(bufToBase50([0b1111_1100,0b0000_1111])).toBe('f0h2')
        // expect(bufToBase50([0])).toBe('00')
        // expect(bufToBase50([1])).toBe('0j')
        // expect(bufToBase50([1,1])).toBe('0D')
    })
})
