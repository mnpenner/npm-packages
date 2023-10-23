import {describe, expect, it} from 'bun:test'
import {charToNum} from './alphabet'


describe('charToBase50', () => {
    it('works', () => {
        expect(charToNum('0')).toEqual(0)
        expect(charToNum('1')).toEqual(1)
        expect(charToNum('2')).toEqual(2)
        expect(charToNum('3')).toEqual(3)
        expect(charToNum('9')).toEqual(9)
        expect(charToNum('b')).toEqual(10)
        expect(charToNum('c')).toEqual(11)
        expect(charToNum('z')).toEqual(29)
        expect(charToNum('B')).toEqual(30)
        expect(charToNum('Z')).toEqual(49)
    })
})
