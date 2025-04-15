#!bun
import {describe, expect, it, test} from 'bun:test'
import {NumberEncoder} from './number-encoder'
import {randomBytes, randomInt, getRandomValues} from 'crypto'

function u8(...args: Array<number | number[]>) {
    return new Uint8Array(args.flat(1))
}

describe(NumberEncoder, () => {
    const NUM_TESTS = 100
    const MIN_BYTES = 1
    const MAX_BYTES = 256

    const base2encoder = new NumberEncoder('01')
    const emojiEncoder = new NumberEncoder('🍓🐋🍃')
    const base50encoder = new NumberEncoder('0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ')
    const hexEncoder = new NumberEncoder('0123456789ABCDEF')
    const base64Encoder = new NumberEncoder('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')

    const BASE36_ALPHA = '0123456789abcdefghijklmnopqrstuvwxyz'


    describe('encodeInt', () => {
        it('matches native impl', () => {
            for(let b=2; b<=36; ++b) {
                const encoder = new NumberEncoder(BASE36_ALPHA.slice(0, b))
                for(let i=0; i<100; ++i) {
                    expect(encoder.encodeInt(i)).toBe(i.toString(b))
                }
                for(let i=0n; i<BigInt(Number.MAX_SAFE_INTEGER)*10n; i=i*2n+1n) {
                    expect(encoder.encodeInt(i)).toBe(i.toString(b))
                }
            }
        })

    })

    describe('encode', () => {
        test('single byte', () => {
            expect(base50encoder.encodeBigEndian([0])).toBe('0')
            expect(base50encoder.encodeBigEndian([49])).toBe('Z')
            expect(base50encoder.encodeBigEndian([50])).toBe('10')


            expect(base2encoder.encodeBigEndian([0])).toBe('0')
            expect(base2encoder.encodeBigEndian([1])).toBe('1')
            expect(base2encoder.encodeBigEndian([2])).toBe('10')
            expect(base2encoder.encodeBigEndian([3])).toBe('11')
        })

        test('encodes multibyte chars', () => {
            expect(emojiEncoder.encodeBigEndian([0])).toBe('🍓')
            expect(emojiEncoder.encodeBigEndian([1])).toBe('🐋')
            expect(emojiEncoder.encodeBigEndian([2])).toBe('🍃')
            expect(emojiEncoder.encodeBigEndian([3])).toBe('🐋🍓')
        })

        test('empty buffer', () => {
            expect(base2encoder.encodeBigEndian([])).toBe('')
            expect(base50encoder.encodeBigEndian([])).toBe('')
            expect(hexEncoder.encodeBigEndian([])).toBe('')
        })

        test('base64 encoder', () => {
            expect(base64Encoder.encodeBigEndian(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.encodeBigEndian([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.encodeBigEndian([0x00, 0x00, 0x00])).toBe('AAA')  // Not the same as base64!
            expect(base64Encoder.encodeBigEndian([0xFB])).toBe('D7')
            expect(base64Encoder.encodeBigEndian([0xFB, 0xFF])).toBe('Pv/')
        })
    })

    describe('decode', () => {
        test('basic', () => {
            expect(base50encoder.decodeBigEndian('0')).toEqual(u8(0))
            expect(base50encoder.decodeBigEndian('Z')).toEqual(u8(49))
            expect(base50encoder.decodeBigEndian('10')).toEqual(u8(50))
            expect(base50encoder.decodeBigEndian('')).toEqual(u8())

            expect(hexEncoder.decodeBigEndian('DEADBEEF')).toEqual(u8([222, 173, 190, 239]))
            expect(hexEncoder.decodeBigEndian('CAFEBABE')).toEqual(u8([202, 254, 186, 190]))
            expect(hexEncoder.decodeBigEndian('DEADC0DE')).toEqual(u8([222, 173, 192, 222]))
            expect(hexEncoder.decodeBigEndian('BAADF00D')).toEqual(u8([186, 173, 240, 13]))
            expect(hexEncoder.decodeBigEndian('FEEDFACE')).toEqual(u8([254, 237, 250, 206]))
            expect(hexEncoder.decodeBigEndian('8BADF00D')).toEqual(u8([139, 173, 240, 13]))
            expect(hexEncoder.decodeBigEndian('FEE1DEAD')).toEqual(u8([254, 225, 222, 173]))
            expect(hexEncoder.decodeBigEndian('DEAD10CC')).toEqual(u8([222, 173, 16, 204]))
            expect(hexEncoder.decodeBigEndian('BADC0DED')).toEqual(u8([186, 220, 13, 237]))
            expect(hexEncoder.decodeBigEndian('C0FFEE')).toEqual(u8([192, 255, 238]))
            expect(hexEncoder.decodeBigEndian('B16B00B5')).toEqual(u8([177, 107, 0, 181]))

            expect(base64Encoder.decodeBigEndian("TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu")).toEqual(new TextEncoder().encode("Many hands make light work."))
        })

        test('decodes multibyte chars', () => {
            expect(emojiEncoder.decodeBigEndian('🍓')).toEqual(u8(0))
            expect(emojiEncoder.decodeBigEndian('🐋')).toEqual(u8(1))
            expect(emojiEncoder.decodeBigEndian('🍃')).toEqual(u8(2))
            expect(emojiEncoder.decodeBigEndian('🐋🍓')).toEqual(u8(3))
        })
    })

    describe('bi-directional', () => {
        test('random bytes', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base50encoder.encodeBigEndian(buf)
                const decoded = base50encoder.decodeBigEndian(encoded)
                expect(decoded).toEqual(buf)
            }
        })
    })
})
