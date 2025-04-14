import {describe, expect, it, test} from 'bun:test'
import {BufferEncoder} from './buffer-encoder'
import {randomBytes, randomInt, getRandomValues} from 'crypto'

function u8(...args: Array<number | number[]>) {
    return new Uint8Array(args.flat(1))
}

describe(BufferEncoder, () => {
    const NUM_TESTS = 100
    const MIN_BYTES = 1
    const MAX_BYTES = 256

    const base2encoder = new BufferEncoder('01')
    const base50encoder = new BufferEncoder('0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ')
    const hexEncoder = new BufferEncoder('0123456789ABCDEF')
    const base64Encoder = new BufferEncoder('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')


    describe('encode', () => {
        test('single byte', () => {
            expect(base50encoder.encode([0])).toBe('0')
            expect(base50encoder.encode([49])).toBe('Z')
            expect(base50encoder.encode([50])).toBe('10')


            expect(base2encoder.encode([0])).toBe('0')
            expect(base2encoder.encode([1])).toBe('1')
            expect(base2encoder.encode([2])).toBe('10')
            expect(base2encoder.encode([3])).toBe('11')
        })

        test('empty buffer', () => {
            expect(base2encoder.encode([])).toBe('')
            expect(base50encoder.encode([])).toBe('')
            expect(hexEncoder.encode([])).toBe('')
        })

        test('base64 encoder', () => {
            expect(base64Encoder.encode(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.encode([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.encode([0x00, 0x00, 0x00])).toBe('AAAA')
            expect(base64Encoder.encode([0xFB])).toBe('+w')
            expect(base64Encoder.encode([0xFB, 0xFF])).toBe('+//')
        })

        test.skip('compare to base64', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                expect(base64Encoder.encode(buf)).toEqual(buf.toString('base64'))
            }
        })
    })

    describe('decode', () => {
        test('basic', () => {
            expect(base50encoder.decode('0')).toEqual(u8(0))
            expect(base50encoder.decode('Z')).toEqual(u8(49))
            expect(base50encoder.decode('10')).toEqual(u8(50))
            expect(base50encoder.decode('')).toEqual(u8())

            expect(hexEncoder.decode('DEADBEEF')).toEqual(u8([222, 173, 190, 239]))
            expect(hexEncoder.decode('CAFEBABE')).toEqual(u8([202, 254, 186, 190]))
            expect(hexEncoder.decode('DEADC0DE')).toEqual(u8([222, 173, 192, 222]))
            expect(hexEncoder.decode('BAADF00D')).toEqual(u8([186, 173, 240, 13]))
            expect(hexEncoder.decode('FEEDFACE')).toEqual(u8([254, 237, 250, 206]))
            expect(hexEncoder.decode('8BADF00D')).toEqual(u8([139, 173, 240, 13]))
            expect(hexEncoder.decode('FEE1DEAD')).toEqual(u8([254, 225, 222, 173]))
            expect(hexEncoder.decode('DEAD10CC')).toEqual(u8([222, 173, 16, 204]))
            expect(hexEncoder.decode('BADC0DED')).toEqual(u8([186, 220, 13, 237]))
            expect(hexEncoder.decode('C0FFEE')).toEqual(u8([192, 255, 238]))
            expect(hexEncoder.decode('B16B00B5')).toEqual(u8([177, 107, 0, 181]))

            expect(base64Encoder.decode("TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu")).toEqual(new TextEncoder().encode("Many hands make light work."))
        })
    })

    describe('bi-directional', () => {
        test('random bytes', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base50encoder.encode(buf)
                const decoded = base50encoder.decode(encoded)
                expect(decoded).toEqual(buf)
            }
        })
    })
})
