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


    describe(NumberEncoder.prototype.encodeInt, () => {
        it('matches native impl', () => {
            for(let b = 2; b <= 36; ++b) {
                const encoder = new NumberEncoder(BASE36_ALPHA.slice(0, b))
                for(let i = 0; i < 100; ++i) {
                    expect(encoder.encodeInt(i)).toBe(i.toString(b))
                }
                for(let i = 0n; i < BigInt(Number.MAX_SAFE_INTEGER) * 10n; i = i * 2n + 1n) {
                    expect(encoder.encodeInt(i)).toBe(i.toString(b))
                }
            }
        })
    })

    describe(NumberEncoder.prototype.decodeInt, () => {
        it('matches native impl', () => {
            for(let b = 2; b <= 36; ++b) {
                const encoder = new NumberEncoder(BASE36_ALPHA.slice(0, b))
                for(let i = 0; i < 100; ++i) {
                    expect(Number(encoder.decodeInt(i.toString(b)))).toBe(i)
                }
                for(let i = 0n; i < BigInt(Number.MAX_SAFE_INTEGER) * 10n; i = i * 2n + 1n) {
                    expect(encoder.decodeInt(i.toString(b))).toBe(i)
                }
            }
        })
    })

    describe(NumberEncoder.prototype.encodeBuf, () => {
        test('single byte', () => {
            expect(base50encoder.encodeBuf([0])).toBe('0')
            expect(base50encoder.encodeBuf([49])).toBe('Z')
            expect(base50encoder.encodeBuf([50])).toBe('10')


            expect(base2encoder.encodeBuf([0])).toBe('0')
            expect(base2encoder.encodeBuf([1])).toBe('1')
            expect(base2encoder.encodeBuf([2])).toBe('10')
            expect(base2encoder.encodeBuf([3])).toBe('11')
        })

        test('encodes multibyte chars', () => {
            expect(emojiEncoder.encodeBuf([0])).toBe('🍓')
            expect(emojiEncoder.encodeBuf([1])).toBe('🐋')
            expect(emojiEncoder.encodeBuf([2])).toBe('🍃')
            expect(emojiEncoder.encodeBuf([3])).toBe('🐋🍓')
        })

        test('empty buffer', () => {
            expect(base2encoder.encodeBuf([])).toBe('')
            expect(base50encoder.encodeBuf([])).toBe('')
            expect(hexEncoder.encodeBuf([])).toBe('')
        })

        test('base64 encoder', () => {
            expect(base64Encoder.encodeBuf(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.encodeBuf([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.encodeBuf([0x00, 0x00, 0x00])).toBe('AAA')  // Not the same as base64!
            expect(base64Encoder.encodeBuf([0xFB])).toBe('D7')
            expect(base64Encoder.encodeBuf([0xFB, 0xFF])).toBe('Pv/')
        })

        test('big-endian', () => {
            expect(hexEncoder.encodeBuf(u8(0, 0xE3))).toBe('0E3')

            expect(hexEncoder.encodeBuf(u8(0, 0, 0))).toBe('000')

            expect(hexEncoder.encodeBuf(u8(0, 0xF0, 0))).toBe('0F000')
            expect(hexEncoder.decodeBuf('0F000')).toEqual(u8(0, 0xF0, 0))

            expect(hexEncoder.encodeBuf(u8(0, 0x0F, 0))).toBe('0F00')
            expect(hexEncoder.decodeBuf('0F00')).toEqual(u8(0, 0x0F, 0))

            expect(hexEncoder.decodeBuf('0E3')).toEqual(u8(0, 0xE3))
            expect(hexEncoder.decodeBuf('00E3')).toEqual(u8(0, 0, 0xE3))
            expect(hexEncoder.decodeBuf('000E3')).toEqual(u8(0, 0, 0, 0xE3))
            expect(hexEncoder.decodeBuf('010002')).toEqual(u8(0, 1, 0, 2))
            expect(hexEncoder.encodeBuf(u8(0, 1, 0, 2))).toEqual('010002')
            expect(hexEncoder.decodeBuf('0003')).toEqual(u8(0, 0, 0, 0x03))
            expect(hexEncoder.decodeBuf('0003')).toEqual(u8(0, 0, 0, 3))
            expect(hexEncoder.encodeBuf(u8(0, 0, 0, 3))).toEqual('0003')
        })
    })

    describe(NumberEncoder.prototype.decodeBuf, () => {
        test('basic', () => {
            expect(base50encoder.decodeBuf('0')).toEqual(u8(0))
            expect(base50encoder.decodeBuf('Z')).toEqual(u8(49))
            expect(base50encoder.decodeBuf('10')).toEqual(u8(50))
            expect(base50encoder.decodeBuf('')).toEqual(u8())

            expect(hexEncoder.decodeBuf('DEADBEEF')).toEqual(u8([222, 173, 190, 239]))
            expect(hexEncoder.decodeBuf('CAFEBABE')).toEqual(u8([202, 254, 186, 190]))
            expect(hexEncoder.decodeBuf('DEADC0DE')).toEqual(u8([222, 173, 192, 222]))
            expect(hexEncoder.decodeBuf('BAADF00D')).toEqual(u8([186, 173, 240, 13]))
            expect(hexEncoder.decodeBuf('FEEDFACE')).toEqual(u8([254, 237, 250, 206]))
            expect(hexEncoder.decodeBuf('8BADF00D')).toEqual(u8([139, 173, 240, 13]))
            expect(hexEncoder.decodeBuf('FEE1DEAD')).toEqual(u8([254, 225, 222, 173]))
            expect(hexEncoder.decodeBuf('DEAD10CC')).toEqual(u8([222, 173, 16, 204]))
            expect(hexEncoder.decodeBuf('BADC0DED')).toEqual(u8([186, 220, 13, 237]))
            expect(hexEncoder.decodeBuf('C0FFEE')).toEqual(u8([192, 255, 238]))
            expect(hexEncoder.decodeBuf('B16B00B5')).toEqual(u8([177, 107, 0, 181]))

            expect(base64Encoder.decodeBuf("TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu")).toEqual(new TextEncoder().encode("Many hands make light work."))
        })

        test('decodes multibyte chars', () => {
            expect(emojiEncoder.decodeBuf('🍓')).toEqual(u8(0))
            expect(emojiEncoder.decodeBuf('🐋')).toEqual(u8(1))
            expect(emojiEncoder.decodeBuf('🍃')).toEqual(u8(2))
            expect(emojiEncoder.decodeBuf('🐋🍓')).toEqual(u8(3))
        })
    })

    describe('round trips', () => {
        test('random bytes', () => {
            for(const encoder of [base50encoder, base2encoder, emojiEncoder, hexEncoder, base64Encoder, base64urlEncoder]) {
                for(let i = 0; i < NUM_TESTS; i++) {
                    const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                    const encoded = encoder.encodeBuf(buf)
                    const decoded = encoder.decodeBuf(encoded)
                    expect(decoded).toEqual(buf)
                }
            }
        })

        test('random ints', () => {
            for(const encoder of [base50encoder, base2encoder, emojiEncoder, hexEncoder, base64Encoder, base64urlEncoder]) {
                for(let i = 0; i < NUM_TESTS; i++) {
                    const num = BigInt(randomInt(-140737488355327, 140737488355328))
                    const encoded = encoder.encodeInt(num)
                    const decoded = encoder.decodeInt(encoded)
                    expect(decoded).toEqual(num)
                }
            }
        })
    })


    describe(NumberEncoder.prototype.maxLength, () => {
        expect(base50encoder.maxLength(16)).toBe(23)
    })
})
