#!bun test
import {describe, expect, it} from 'bun:test'
import {ChunkedBufferEncoder} from './chunked-buffer-encoder'
import {ASCII85, BASE64STD} from './alphabets'
import {randomUint8Array, u8, uint8ArrayToBase64, uint8ArrayToHex} from './uint8_util'

const BASE2048 = (() => {
    const tmp: string[] = []
    let cp = 0
    do {
        const ch = String.fromCodePoint(cp++)
        if(!/\p{C}|\p{Z}/u.test(ch)) {
            tmp.push(ch)
        }
    } while(tmp.length < 2048)
    return tmp.join('')
})()


describe(ChunkedBufferEncoder, () => {
    const NUM_TESTS = 10_000
    const MIN_BYTES = 1
    const MAX_BYTES = 17

    const base64Encoder = new ChunkedBufferEncoder(BASE64STD, 3)
    const ascii85Encoder = new ChunkedBufferEncoder(ASCII85, 4, 5)
    const base3encoder = new ChunkedBufferEncoder('012', 12, 61)
    const base7encoder = new ChunkedBufferEncoder('0123456', 7, 20)
    const emojiEncoder = new ChunkedBufferEncoder('🍓🐋🍃', 12, 61)
    // const base2048hard = new ChunkedBufferEncoder(BASE2048, 11)

    describe(ChunkedBufferEncoder.prototype.encode, () => {
        it('encodes base64', () => {
            expect(base64Encoder.encode(Buffer.from("Many hands make light work."))).toBe('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')
            expect(base64Encoder.encode([0xFF, 0xFF, 0xFF])).toBe('////')
            expect(base64Encoder.encode([0xFB])).toBe('+w')  // Buffer.from([0xFB]).toString('base64')
            expect(base64Encoder.encode(u8(0, 0, 0xFB))).toBe('AAD7')
            expect(base64Encoder.encode([0xFB, 0xFF])).toBe('+/8')
            expect(base64Encoder.encode([0, 0xFB, 0xFF])).toBe('APv/')
            expect(base64Encoder.encode([0])).toBe('AA')
            expect(base64Encoder.encode([0, 0, 0])).toBe('AAAA')
            expect(base64Encoder.encode([0, 0, 0, 0])).toBe('AAAAAA')
            expect(base64Encoder.encode([])).toBe('')
        })

        it('base64 matches native impl', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomUint8Array(MIN_BYTES, MAX_BYTES)
                // const expected = buf.toString('base64').replace(/={1,2}$/,'')
                const expected = uint8ArrayToBase64(buf).replace(/={1,2}$/, '')
                expect(base64Encoder.encode(buf), uint8ArrayToHex(buf)).toEqual(expected)
            }
        })

        it('encodes base 3', () => {
            expect(base3encoder.encode(Array(12).fill(0))).toBe('0'.repeat(61))

            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])).toBe("0000000000000000000000000000000000000000000000000000000000001")
            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2])).toBe("0000000000000000000000000000000000000000000000000000000000002")
            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3])).toBe("0000000000000000000000000000000000000000000000000000000000010")
            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0])).toBe("0000000000000000000000000000000000000000000000000000000100111")
            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])).toBe("000000000000000000000000000000000000000000000000000000010011")

            expect(base3encoder.encode(Array(12).fill(0xFF))).toBe("1212110111002210101020122121220102012011122012011002222201100")
            expect(base3encoder.encode([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe("000001202220022000020001111111010220202102122210111010011102")
            expect(base3encoder.encode([1, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe("00000120222002200002000111111101022020210212221011101001110")

            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xFF]), "256 = 1*3**5 + 1*3**2 + 1*3**1 + 0*3**0").toBe('0000000000000000000000000000000000000000000000000000000100110')
            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]), "256 = 1*3**5 + 1*3**2 + 1*3**1 + 1*3**0").toBe('0000000000000000000000000000000000000000000000000000000100111')
            expect(base3encoder.encode([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]), "256 = 1*3**5 + 1*3**2 + 1*3**1 + 1*3**0").toBe('0000000000000000000000000000000000000000000000000000000100112')
        })

        it('works with multi-byte chars', () => {
            expect(emojiEncoder.encode([0])).toBe("🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓")
            expect(emojiEncoder.encode([1])).toBe("🍓🍓🍓🍓🍓🐋🍃🍓🍃🍃🍃🍓🍓🍃🍃🍓🍓🍓🍓🍃🍓🍓🍓🐋🐋🐋🐋🐋🐋🐋🍓🐋🍓🍃🍃🍓🍃🍓🍃🐋🍓🍃🐋🍃🍃🍃🐋🍓🐋🐋")
        })

        it('encodes ascii85', () => {
            // https://en.wikipedia.org/wiki/Ascii85#Example_for_Ascii85
            expect(ascii85Encoder.encode(Buffer.from("Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure."))).toBe('9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF<G%<+EV:2F!,O<' +
                'DJ+*.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF"AGXBPCsi+DGm>@3BB/F*&OCAfu2/AKYi(' +
                'DIb:@FD,*)+C]U=@3BN#EcYf8ATD3s@q?d$AftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(' +
                'DId<j@<?3r@:F%a+D58\'ATD4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>u' +
                'D.RTpAKYo\'+CT/5+Cei#DII?(E,9)oF*2M7/c')
        })
    })

    describe(ChunkedBufferEncoder.prototype.decode, () => {
        it('decodes base64', () => {
            expect(base64Encoder.decode('TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu')).toEqual(Buffer.from("Many hands make light work."))
            expect(base64Encoder.decode('////')).toEqual(u8(0xFF, 0xFF, 0xFF))
            expect(base64Encoder.decode('D7')).toEqual(u8(0x0F))
            expect(base64Encoder.decode('Pv/')).toEqual(u8(62, 255))
            expect(base64Encoder.decode('X2ipInk')).toEqual(u8(95, 104, 169, 34, 121))

            expect(base64Encoder.decode('AA')).toEqual(u8([0]))
            expect(base64Encoder.decode('AAAA')).toEqual(u8([0, 0, 0]))
            expect(base64Encoder.decode('AAAAAA')).toEqual(u8([0, 0, 0, 0]))
        })

        it('decodes base 3', () => {
            expect(base3encoder.decode('0'.repeat(61))).toEqual(u8(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))
            expect(base3encoder.decode('0000000000000000000000000000000000000000000000000000000000001')).toEqual(u8(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1))
            expect(base3encoder.decode('0000000000000000000000000000000000000000000000000000000000010')).toEqual(u8(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3))
            expect(base3encoder.decode('1'.repeat(61))).toEqual(u8(205, 117, 183, 102, 54, 100, 123, 253, 220, 82, 240, 137))
        })

        it('works with multi-byte chars', () => {
            expect(emojiEncoder.decode("🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓🍓")).toEqual(u8(0))
            expect(emojiEncoder.decode("🍓🍓🍓🍓🍓🐋🍃🍓🍃🍃🍃🍓🍓🍃🍃🍓🍓🍓🍓🍃🍓🍓🍓🐋🐋🐋🐋🐋🐋🐋🍓🐋🍓🍃🍃🍓🍃🍓🍃🐋🍓🍃🐋🍃🍃🍃🐋🍓🐋🐋")).toEqual(u8(1))
        })

        it('matches native impl', () => {
            for(let i = 0; i < NUM_TESTS; i++) {
                const buf = randomUint8Array(MIN_BYTES, MAX_BYTES)
                const encoded = uint8ArrayToBase64(buf).replace(/={1,2}$/, '')
                expect(base64Encoder.decode(encoded), `Uint8Array(${buf.length}){${uint8ArrayToHex(buf)}}  Encoded: ${encoded}`).toEqual(buf)
            }
        })

        it('decodes ascii85', () => {
            // https://en.wikipedia.org/wiki/Ascii85#Example_for_Ascii85
            expect(ascii85Encoder.decode('9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF<G%<+EV:2F!,O<' +
                'DJ+*.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF"AGXBPCsi+DGm>@3BB/F*&OCAfu2/AKYi(' +
                'DIb:@FD,*)+C]U=@3BN#EcYf8ATD3s@q?d$AftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(' +
                'DId<j@<?3r@:F%a+D58\'ATD4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>u' +
                'D.RTpAKYo\'+CT/5+Cei#DII?(E,9)oF*2M7/c')).toEqual(Buffer.from("Man is distinguished, not only by his reason, but by this singular passion from other animals, which is a lust of the mind, that by a perseverance of delight in the continued and indefatigable generation of knowledge, exceeds the short vehemence of any carnal pleasure."))
        })
    })

    describe('round trip', () => {
        it('basic', () => {
                for(const encoder of [base64Encoder, base3encoder, base7encoder, emojiEncoder, ascii85Encoder]) {
                    // console.log('encoder', encoder.base)
                    for(const buf of [u8(1), u8(0, 1), u8(1, 0)]) {
                        const encoded = encoder.encode(buf)
                        // console.log('encoded', buf, uint8ArrayToHex(buf), `"${encoded}"
                        // (${Array.from(encoded).length} chars)`)
                        const decoded = encoder.decode(encoded)
                        // console.log('decoded', decoded)
                        expect(decoded, `Base ${encoder.base} Buf: ${uint8ArrayToHex(buf)} Encoded: "${encoded}"`).toEqual(buf)
                    }
                }
            }
        )

        it.skipIf(!Bun.env.RUN_SLOW_TESTS)('random bytes', () => {
            for(const encoder of [base64Encoder, base3encoder, base7encoder, emojiEncoder, ascii85Encoder]) {
                for(let i = 0; i < NUM_TESTS; i++) {
                    const buf = randomUint8Array(MIN_BYTES, MAX_BYTES)
                    const encoded = encoder.encode(buf)
                    const decoded = encoder.decode(encoded)
                    expect(decoded, `Base ${encoder.base} Buf: ${uint8ArrayToHex(buf)} Encoded: ${encoded}`).toEqual(buf)
                }
            }
        })

        it.skipIf(!Bun.env.RUN_SLOW_TESTS)('all encoders, all chunk sizes', () => {
            for(let b=2;b<=256;++b) {
                const alpha = BASE2048.slice(0, b)
                // console.log(`Base ${b} | ${alpha}`)
                for(let c=2;c<=16;++c) {
                    const encoder = new ChunkedBufferEncoder(alpha, c)
                    // console.log(`  ${encoder.bytesPerChunk} bytes <=> ${encoder.charsPerChunk} chars`)

                    for(let i = 0; i < 100; i++) {
                        const buf = randomUint8Array(1, 17)
                        const encoded = encoder.encode(buf)
                        const decoded = encoder.decode(encoded)
                        expect(decoded, `Base ${encoder.base} Buf: ${uint8ArrayToHex(buf)} Encoded: ${encoded}`).toEqual(buf)
                    }
                }
            }
        })
    })
})


