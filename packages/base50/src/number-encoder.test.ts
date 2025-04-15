#!bun
import {describe, expect, it, test} from 'bun:test'
import {NumberEncoder} from './number-encoder'
import {randomBytes, randomInt, getRandomValues} from 'crypto'

function u8(...args: Array<number | number[]>) {
    return new Uint8Array(args.flat(1))
}

describe(NumberEncoder, () => {
    const NUM_TESTS = 1000
    const MIN_BYTES = 1
    const MAX_BYTES = 256

    const base2encoder = new NumberEncoder('01')
    const emojiEncoder = new NumberEncoder('🍓🐋🍃')
    const base50encoder = new NumberEncoder('0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ')
    const hexEncoder = new NumberEncoder('0123456789ABCDEF')
    const base64Encoder = new NumberEncoder('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')
    const base64urlEncoder = new NumberEncoder('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')

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
            expect(base50encoder.encodeBE([0])).toBe('0')
            expect(base50encoder.encodeBE([49])).toBe('Z')
            expect(base50encoder.encodeBE([50])).toBe('10')


            expect(base2encoder.encodeBE([0])).toBe('0')
            expect(base2encoder.encodeBE([1])).toBe('1')
            expect(base2encoder.encodeBE([2])).toBe('10')
            expect(base2encoder.encodeBE([3])).toBe('11')
        })

        test('encodes multibyte chars', () => {
            expect(emojiEncoder.encodeBE([0])).toBe('🍓')
            expect(emojiEncoder.encodeBE([1])).toBe('🐋')
            expect(emojiEncoder.encodeBE([2])).toBe('🍃')
            expect(emojiEncoder.encodeBE([3])).toBe('🐋🍓')
        })

        test('empty buffer', () => {
            expect(base2encoder.encodeBE([])).toBe('')
            expect(base50encoder.encodeBE([])).toBe('')
            expect(hexEncoder.encodeBE([])).toBe('')
        })

        test('base64 encoder', () => {
            expect(base64Encoder.encodeBE(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.encodeBE([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.encodeBE([0x00, 0x00, 0x00])).toBe('AAA')  // Not the same as base64!
            expect(base64Encoder.encodeBE([0xFB])).toBe('D7')
            expect(base64Encoder.encodeBE([0xFB, 0xFF])).toBe('Pv/')
        })

        test('endianness', () => {
            expect(hexEncoder.encodeBE(u8(0,0xE3))).toBe('0E3')
            expect(hexEncoder.encodeLE(u8(0,0xE3))).toBe('E300')

            expect(hexEncoder.decodeBE('0E3')).toEqual(u8(0,0xE3))
            expect(hexEncoder.decodeLE('E300')).toEqual(u8(0,0xE3))
        })
    })

    describe('decode', () => {
        test('basic', () => {
            expect(base50encoder.decodeBE('0')).toEqual(u8(0))
            expect(base50encoder.decodeBE('Z')).toEqual(u8(49))
            expect(base50encoder.decodeBE('10')).toEqual(u8(50))
            expect(base50encoder.decodeBE('')).toEqual(u8())

            expect(hexEncoder.decodeBE('DEADBEEF')).toEqual(u8([222, 173, 190, 239]))
            expect(hexEncoder.decodeBE('CAFEBABE')).toEqual(u8([202, 254, 186, 190]))
            expect(hexEncoder.decodeBE('DEADC0DE')).toEqual(u8([222, 173, 192, 222]))
            expect(hexEncoder.decodeBE('BAADF00D')).toEqual(u8([186, 173, 240, 13]))
            expect(hexEncoder.decodeBE('FEEDFACE')).toEqual(u8([254, 237, 250, 206]))
            expect(hexEncoder.decodeBE('8BADF00D')).toEqual(u8([139, 173, 240, 13]))
            expect(hexEncoder.decodeBE('FEE1DEAD')).toEqual(u8([254, 225, 222, 173]))
            expect(hexEncoder.decodeBE('DEAD10CC')).toEqual(u8([222, 173, 16, 204]))
            expect(hexEncoder.decodeBE('BADC0DED')).toEqual(u8([186, 220, 13, 237]))
            expect(hexEncoder.decodeBE('C0FFEE')).toEqual(u8([192, 255, 238]))
            expect(hexEncoder.decodeBE('B16B00B5')).toEqual(u8([177, 107, 0, 181]))

            expect(base64Encoder.decodeBE("TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu")).toEqual(new TextEncoder().encode("Many hands make light work."))
        })

        test('decodes multibyte chars', () => {
            expect(emojiEncoder.decodeBE('🍓')).toEqual(u8(0))
            expect(emojiEncoder.decodeBE('🐋')).toEqual(u8(1))
            expect(emojiEncoder.decodeBE('🍃')).toEqual(u8(2))
            expect(emojiEncoder.decodeBE('🐋🍓')).toEqual(u8(3))
        })
    })

    describe.skip('bi-directional', () => {
        test('random bytes BE', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base50encoder.encodeBE(buf)
                const decoded = base50encoder.decodeBE(encoded)
                expect(decoded).toEqual(buf)
            }
        })

        test('random bytes LE', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base50encoder.encodeLE(buf)
                const decoded = base50encoder.decodeLE(encoded)
                expect(decoded).toEqual(buf)
            }
        })
    })
})
