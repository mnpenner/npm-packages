#!bun test
import {describe, expect, it} from 'bun:test'
import {ChunkedBufferEncoder} from './chunked-buffer-encoder'
import {ASCII85_RFC1924, BASE64STD} from './alphabets'
import {randomBytes, randomInt} from 'crypto'
import {randomUint8Array, u8, uint8ArrayToBase64, uint8ArrayToHex} from './uint8_util'
import {NumberEncoder} from './number-encoder'


describe(ChunkedBufferEncoder, () => {
    const NUM_TESTS = 10000
    const MIN_BYTES = 1
    const MAX_BYTES = 1

    const base64Encoder = new ChunkedBufferEncoder(BASE64STD, 3)
    const ascii85Encoder = new ChunkedBufferEncoder(ASCII85_RFC1924, 4,5)
    const base3encoder = new ChunkedBufferEncoder('012', 12, 61)
    const base7encoder = new ChunkedBufferEncoder('0123456', 7, 20)
    const emojiEncoder = new ChunkedBufferEncoder('🍓🐋🍃', 12, 61)

    describe(ChunkedBufferEncoder.prototype.encode, () => {
        it('encodes', () => {
            expect(base64Encoder.encode(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.encode([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.encode([0xFB])).toBe('+w')  // Buffer.from([0xFB]).toString('base64')
            expect(base64Encoder.encode(u8(0, 0, 0xFB))).toBe('AAD7')
            expect(base64Encoder.encode([0xFB, 0xFF])).toBe('+/8')
            expect(base64Encoder.encode([0, 0xFB, 0xFF])).toBe('APv/')
            expect(base64Encoder.encode([0])).toBe('AA')
            expect(base64Encoder.encode([0,0,0])).toBe('AAAA')
            expect(base64Encoder.encode([0,0,0,0])).toBe('AAAAAA')
            expect(base64Encoder.encode([])).toBe('')
        })

        it('matches native impl', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomUint8Array(MIN_BYTES, MAX_BYTES)
                // const expected = buf.toString('base64').replace(/={1,2}$/,'')
                const expected = uint8ArrayToBase64(buf).replace(/={1,2}$/, '')
                expect(base64Encoder.encode(buf), uint8ArrayToHex(buf)).toEqual(expected)
            }
        })

        it.skip('works for base 3', () => {
            // expect(base3encoder.encode([1,0,0,0,0,0,0,0,0,0,0,0])).toBe("1010201211121002122102111212120000120002122210020100100202220")
            expect(base3encoder.encode(Array(12).fill(0xFF))).toBe('2'.repeat(61))
            expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,1,0])).toBe("1010112111220012121202100101002120210211100210211220000122010")
            expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,1])).toBe("101011211122001212120210010100212021021110021021122000012201")
            expect(base3encoder.encode([1,0,0,0,0,0,0,0,0,0,0])).toBe("101020121112100212210211121212000012000212221002010010020222")
            // FIXME: how can we know how many trailing 0s there's supposed to be?
            expect(base3encoder.encode([1,0,0,0,0,0,0,0,0,0])).toBe("10102012111210021221021112121200001200021222100201001002022")
            // expect(base3encoder.encode(Array(12).fill(0))).toBe('0'.repeat(61))
            // expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,0,1])).toBe('0000000000000000000000000000000000000000000000000000000000001')
            // expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,0,2])).toBe('0000000000000000000000000000000000000000000000000000000000002')
            // expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,0,3])).toBe('0000000000000000000000000000000000000000000000000000000000010')
            // expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,0,0xFF]),"256 = 1*3**5 + 1*3**2 + 1*3**1 + 0*3**0").toBe('0000000000000000000000000000000000000000000000000000000100110')
            // expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,1,0]),"256 = 1*3**5 + 1*3**2 + 1*3**1 + 1*3**0").toBe('0000000000000000000000000000000000000000000000000000000100111')
            // expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,1,1]),"256 = 1*3**5 + 1*3**2 + 1*3**1 + 1*3**0").toBe('0000000000000000000000000000000000000000000000000000000100112')
            // expect(base3encoder.encode([0,0,0,0,0,0,0,0,0,0,1])).toBe('0000000000000000000000000000000000000000000000000000000100111')
            // expect(base3encoder.decode('1111111111111111111111111111111111111111111111111111111111111')).toEqual(u8(Array(12).fill(0xFF)))
            // expect(base3encoder.encode([0,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF])).toBe('1111111111111111111111111111111111111111111111111111111111111')
        })

        it.skip('works with multi-byte chars', () => {
            // How many strawberries should this be?!
            expect(emojiEncoder.encode([0])).toBe("🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓")
            expect(emojiEncoder.encode([1])).toBe("🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓")
        })
    })

    describe(ChunkedBufferEncoder.prototype.decode, () => {
        it('decodes', () => {
            expect(base64Encoder.decode('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')).toEqual(Buffer.from("Many hands make light work."))
            expect(base64Encoder.decode('////')).toEqual(u8(0xFF, 0xFF, 0xFF))
            expect(base64Encoder.decode('D7')).toEqual(u8(0x0F))
            expect(base64Encoder.decode('Pv/')).toEqual(u8(62,255))
            expect(base64Encoder.decode('X2ipInk')).toEqual(u8(95, 104, 169, 34, 121))

            expect(base64Encoder.decode('AA')).toEqual(u8([0]))
            expect(base64Encoder.decode('AAAA')).toEqual(u8([0,0,0]))
            expect(base64Encoder.decode('AAAAAA')).toEqual(u8([0,0,0,0]))
        })

        it('matches native impl', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomUint8Array(MIN_BYTES, MAX_BYTES)
                const encoded = uint8ArrayToBase64(buf).replace(/={1,2}$/, '')
                expect(base64Encoder.decode(encoded), `Uint8Array(${buf.length}){${uint8ArrayToHex(buf)}}  Encoded: ${encoded}`).toEqual(buf)
            }
        })
    })

    describe('round trip', () => {
        it('basic', () => {
            for(const buf of [u8(1),u8(0,1),u8(1,0)]) {
                for(const encoder of [base64Encoder, base3encoder, base7encoder, emojiEncoder]) {
                    const encoded = encoder.encode(buf)
                    const decoded = encoder.decode(encoded)
                    expect(decoded, `Buf: ${uint8ArrayToHex(buf)} Encoded: ${encoded}`).toEqual(buf)
                }
            }
        })

        it('random bytes', () => {
            for(const encoder of [base64Encoder,base3encoder,base7encoder, emojiEncoder]) {
                console.log(`Testing base ${encoder.base} (${encoder.alphabet.join('')}) ...`)
                for(let i = 0; i < NUM_TESTS; i++) {
                    const buf = randomUint8Array(MIN_BYTES, MAX_BYTES)
                    const encoded = encoder.encode(buf)
                    const decoded = encoder.decode(encoded)
                    expect(decoded, `Base ${encoder.base} Buf: ${uint8ArrayToHex(buf)} Encoded: ${encoded}`).toEqual(buf)
                }
            }
        })
    })
})


