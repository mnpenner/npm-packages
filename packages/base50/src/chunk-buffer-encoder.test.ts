#!bun
import {describe, expect, it, test} from 'bun:test'
import {ChunkedBufferEncoder} from './chunked-buffer-encoder'
import {BASE64STD, BASE64URL} from './alphabets'
import {randomBytes, randomInt} from 'crypto'


describe(ChunkedBufferEncoder, () => {
    const NUM_TESTS = 1000
    const MIN_BYTES = 1
    const MAX_BYTES = 256

    const base64Encoder = new ChunkedBufferEncoder(BASE64STD, 3, 4)

    describe(ChunkedBufferEncoder.prototype.encode, () => {
        it('encodes', () => {
            expect(base64Encoder.encode(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.encode([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.encode([0xFB])).toBe('D7')
            expect(base64Encoder.encode(u8(0, 0, 0xFB))).toBe('AAD7')
            expect(base64Encoder.encode([0xFB, 0xFF])).toBe('Pv/')
        })

        it('decodes', () => {
            expect(base64Encoder.decode('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')).toEqual(Buffer.from("Many hands make light work."))
            expect(base64Encoder.decode('////')).toEqual(u8(0xFF, 0xFF, 0xFF))
            expect(base64Encoder.decode('D7')).toEqual(u8(0, 0, 0xFB))
            expect(base64Encoder.decode('Pv/')).toEqual(u8(0, 0xFB, 0xFF))
        })

        it('matches native impl', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const expected = buf.toString('base64').replace(/={1,2}$/,'')
                expect(base64Encoder.encode(buf)).toEqual(expected)
            }
        })
    })

    describe('fuzz test', () => {
        it('random bytes round trip', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base64Encoder.encode(buf)
                const decoded = base64Encoder.decode(encoded)
                expect(decoded).toEqual(buf)
            }
        })
    })


})

function u8(...args: Array<number | number[]>) {
    return new Uint8Array(args.flat(1))
}
