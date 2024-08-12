import {describe, expect, it, test} from 'bun:test'
import {base50ToBuf, bufToBase50, chunk6bits, sextets2buf} from './buffer'


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

test('sextets', () => {
    expect([...sextets2buf([0b111111,0b000000,0b111100])]).toEqual([0b1111_1100,0b0000_1111])
    expect([...sextets2buf([ 63, 0, 60 ])]).toEqual([0b1111_1100,0b0000_1111])
    expect([...sextets2buf([0b111111,0b000000,0b111100,0b000011])]).toEqual([0b1111_1100,0b0000_1111,0b0000_0011])
    expect([...sextets2buf([0b111111,0b000000,0b111100,0b001100])]).toEqual([0b1111_1100,0b0000_1111,0b0000_1100])
    expect([...sextets2buf([0b111111,0b000000,0b111101])]).toEqual([0b1111_1100,0b0000_1111,0b0100_0000])
})

describe('bufToBase50', () => {
    it('works', () => {
        // expect(bufToBase50([0b0000_0000])).toBe('00')
        // expect(bufToBase50([0b0000_0100])).toBe('10') // not going to work because the 6th bit is shared with the next chunk...
        expect(bufToBase50([0b1111_1100,0b0000_1111])).toBe('Zg0Zc')
        // expect(bufToBase50([0])).toBe('00')
        // expect(bufToBase50([1])).toBe('0j')
        // expect(bufToBase50([1,1])).toBe('0D')
    })
})

test('sextets', () => {
    expect(base50ToBuf('Zg0Zc')).toEqual(new Uint8Array([0b1111_1100,0b0000_1111]))
})
