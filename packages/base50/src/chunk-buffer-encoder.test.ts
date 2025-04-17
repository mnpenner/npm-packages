#!bun
import {describe, expect, it, test} from 'bun:test'
import {ChunkedBufferEncoder} from './chunked-buffer-encoder'
import {BASE64STD, BASE64URL} from './alphabets'
import {randomBytes, randomInt} from 'crypto'


describe(ChunkedBufferEncoder, () => {
    const NUM_TESTS = 1000
    const MIN_BYTES = 1
    const MAX_BYTES = 256

    const base64urlEncoder = new ChunkedBufferEncoder(BASE64STD, 3, 4)

    describe(ChunkedBufferEncoder.prototype.encode, () => {
        it('encodes', () => {
            expect(base64urlEncoder.encode(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64urlEncoder.encode([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64urlEncoder.encode([0xFB])).toBe('D7')
            expect(base64urlEncoder.encode(u8(0, 0, 0xFB))).toBe('D7')
            expect(base64urlEncoder.encode([0xFB, 0xFF])).toBe('Pv/')
        })

        it('decodes', () => {
            expect(base64urlEncoder.decode('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')).toEqual(Buffer.from("Many hands make light work."))
            expect(base64urlEncoder.decode('////')).toEqual(u8(0xFF, 0xFF, 0xFF))
            expect(base64urlEncoder.decode('D7')).toEqual(u8(0, 0, 0xFB))
            expect(base64urlEncoder.decode('Pv/')).toEqual(u8(0, 0xFB, 0xFF))
        })


    })

    describe.skip('round trips', () => {
        test('random bytes BE', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomBytes(randomInt(MIN_BYTES, MAX_BYTES + 1))
                const encoded = base64urlEncoder.encode(buf)
                const decoded = base64urlEncoder.decode(encoded)
                expect(decoded).toEqual(buf)
            }
        })

    })
})

function u8(...args: Array<number | number[]>) {
    return new Uint8Array(args.flat(1))
}
