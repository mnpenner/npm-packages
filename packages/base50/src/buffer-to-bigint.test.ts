#!bun
import {describe, expect, it, test} from 'bun:test'
import {NumberEncoder} from './number-encoder'
import {randomBytes, randomInt, getRandomValues} from 'crypto'
import {beBufToBigInt, leBufToInt} from './buffer-to-bigint'

function u8(...args: Array<number | number[]>) {
    return new Uint8Array(args.flat(1))
}

describe(beBufToBigInt, () => {
    test('encodeIntBE', () => {
        // Compare with https://nodejs.org/api/buffer.html#bufreadbiguint64beoffset
        expect(beBufToBigInt([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff])).toBe(4294967295n)
        expect(beBufToBigInt(Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]))).toBe(4294967295n)
        expect(beBufToBigInt(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]))).toBe(4294967295n)

        expect(beBufToBigInt(Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff, 0xff]))).toBe(16777215n)  // 1-6 bytes
        expect(beBufToBigInt(Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff]))).toBe(16777215n)  // 7 bytes
    })
})


describe(leBufToInt, () => {
    test('encodeIntLE', () => {
        expect(leBufToInt([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff])).toBe(18446744069414584320n)
        expect(leBufToInt(Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]))).toBe(18446744069414584320n)
        expect(leBufToInt(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]))).toBe(18446744069414584320n)

        expect(leBufToInt(Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff, 0xff]))).toBe(281474959933440n)
    })
})
