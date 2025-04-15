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


    describe(NumberEncoder.prototype.intToStr, () => {
        it('matches native impl', () => {
            for(let b=2; b<=36; ++b) {
                const encoder = new NumberEncoder(BASE36_ALPHA.slice(0, b))
                for(let i=0; i<100; ++i) {
                    expect(encoder.intToStr(i)).toBe(i.toString(b))
                }
                for(let i=0n; i<BigInt(Number.MAX_SAFE_INTEGER)*10n; i=i*2n+1n) {
                    expect(encoder.intToStr(i)).toBe(i.toString(b))
                }
            }
        })
    })

    describe(NumberEncoder.prototype.strToInt, () => {
        it('matches native impl', () => {
            for(let b=2; b<=36; ++b) {
                const encoder = new NumberEncoder(BASE36_ALPHA.slice(0, b))
                for(let i=0; i<100; ++i) {
                    expect(Number(encoder.strToInt(i.toString(b)))).toBe(i)
                }
                for(let i=0n; i<BigInt(Number.MAX_SAFE_INTEGER)*10n; i=i*2n+1n) {
                    expect(encoder.strToInt(i.toString(b))).toBe(i)
                }
            }
        })
    })

    describe(NumberEncoder.prototype.bufToStr, () => {
        test('single byte', () => {
            expect(base50encoder.bufToStr([0])).toBe('0')
            expect(base50encoder.bufToStr([49])).toBe('Z')
            expect(base50encoder.bufToStr([50])).toBe('10')


            expect(base2encoder.bufToStr([0])).toBe('0')
            expect(base2encoder.bufToStr([1])).toBe('1')
            expect(base2encoder.bufToStr([2])).toBe('10')
            expect(base2encoder.bufToStr([3])).toBe('11')
        })

        test('encodes multibyte chars', () => {
            expect(emojiEncoder.bufToStr([0])).toBe('🍓')
            expect(emojiEncoder.bufToStr([1])).toBe('🐋')
            expect(emojiEncoder.bufToStr([2])).toBe('🍃')
            expect(emojiEncoder.bufToStr([3])).toBe('🐋🍓')
        })

        test('empty buffer', () => {
            expect(base2encoder.bufToStr([])).toBe('')
            expect(base50encoder.bufToStr([])).toBe('')
            expect(hexEncoder.bufToStr([])).toBe('')
        })

        test('base64 encoder', () => {
            expect(base64Encoder.bufToStr(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.bufToStr([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.bufToStr([0x00, 0x00, 0x00])).toBe('AAA')  // Not the same as base64!
            expect(base64Encoder.bufToStr([0xFB])).toBe('D7')
            expect(base64Encoder.bufToStr([0xFB, 0xFF])).toBe('Pv/')
        })

        test('big-endian', () => {
            expect(hexEncoder.bufToStr(u8(0,0xE3))).toBe('0E3')

            expect(hexEncoder.bufToStr(u8(0,0,0))).toBe('000')

            expect(hexEncoder.bufToStr(u8(0,0xF0,0))).toBe('0F000')
            expect(hexEncoder.strToBuf('0F000')).toEqual(u8(0,0xF0,0))

            expect(hexEncoder.bufToStr(u8(0,0x0F,0))).toBe('0F00')
            expect(hexEncoder.strToBuf('0F00')).toEqual(u8(0,0x0F,0))

            expect(hexEncoder.strToBuf('0E3')).toEqual(u8(0,0xE3))
            expect(hexEncoder.strToBuf('00E3')).toEqual(u8(0,0,0xE3))
            expect(hexEncoder.strToBuf('000E3')).toEqual(u8(0,0,0,0xE3))
            expect(hexEncoder.strToBuf('010002')).toEqual(u8(0,1,0,2))
            expect(hexEncoder.bufToStr(u8(0,1,0,2))).toEqual('010002')
            expect(hexEncoder.strToBuf('0003')).toEqual(u8(0,0,0,0x03))
            expect(hexEncoder.strToBuf('0003')).toEqual(u8(0,0,0,3))
            expect(hexEncoder.bufToStr(u8(0,0,0,3))).toEqual('0003')
        })
    })

    describe.skip(NumberEncoder.prototype.leStrToBuf, () => {
        test('little-endian', () => {
            const orig = u8(0, 0xE3)
            expect(hexEncoder.leStrToBuf(hexEncoder.leBufToStr(orig))).toEqual(orig)
        })
    })

    describe(NumberEncoder.prototype.strToBuf, () => {
        test('basic', () => {
            expect(base50encoder.strToBuf('0')).toEqual(u8(0))
            expect(base50encoder.strToBuf('Z')).toEqual(u8(49))
            expect(base50encoder.strToBuf('10')).toEqual(u8(50))
            expect(base50encoder.strToBuf('')).toEqual(u8())

            expect(hexEncoder.strToBuf('DEADBEEF')).toEqual(u8([222, 173, 190, 239]))
            expect(hexEncoder.strToBuf('CAFEBABE')).toEqual(u8([202, 254, 186, 190]))
            expect(hexEncoder.strToBuf('DEADC0DE')).toEqual(u8([222, 173, 192, 222]))
            expect(hexEncoder.strToBuf('BAADF00D')).toEqual(u8([186, 173, 240, 13]))
            expect(hexEncoder.strToBuf('FEEDFACE')).toEqual(u8([254, 237, 250, 206]))
            expect(hexEncoder.strToBuf('8BADF00D')).toEqual(u8([139, 173, 240, 13]))
            expect(hexEncoder.strToBuf('FEE1DEAD')).toEqual(u8([254, 225, 222, 173]))
            expect(hexEncoder.strToBuf('DEAD10CC')).toEqual(u8([222, 173, 16, 204]))
            expect(hexEncoder.strToBuf('BADC0DED')).toEqual(u8([186, 220, 13, 237]))
            expect(hexEncoder.strToBuf('C0FFEE')).toEqual(u8([192, 255, 238]))
            expect(hexEncoder.strToBuf('B16B00B5')).toEqual(u8([177, 107, 0, 181]))

            expect(base64Encoder.strToBuf("TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu")).toEqual(new TextEncoder().encode("Many hands make light work."))
        })

        test('decodes multibyte chars', () => {
            expect(emojiEncoder.strToBuf('🍓')).toEqual(u8(0))
            expect(emojiEncoder.strToBuf('🐋')).toEqual(u8(1))
            expect(emojiEncoder.strToBuf('🍃')).toEqual(u8(2))
            expect(emojiEncoder.strToBuf('🐋🍓')).toEqual(u8(3))
        })
    })

    describe('round trips', () => {
        test('random bytes BE', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base50encoder.bufToStr(buf)
                const decoded = base50encoder.strToBuf(encoded)
                expect(decoded).toEqual(buf)
            }
        })

        test.skip('random bytes LE', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base50encoder.leBufToStr(buf)
                const decoded = base50encoder.leStrToBuf(encoded)
                expect(decoded).toEqual(buf)
            }
        })
    })
})
