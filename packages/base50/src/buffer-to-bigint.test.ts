#!bun
import { describe, expect, test } from 'bun:test'
import { bufToInt, leBufToBigInt } from './buffer-to-bigint'

function u8(...args: Array<number | number[]>) {
    return new Uint8Array(args.flat(1))
}

describe(bufToInt, () => {
    test('like node', () => {
        // Compare with https://nodejs.org/api/buffer.html#bufreadbiguint64beoffset
        expect(bufToInt([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff])).toBe(4294967295n)
        expect(bufToInt(Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]))).toBe(
            4294967295n,
        )
        expect(bufToInt(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]))).toBe(
            4294967295n,
        )
    })

    test('buffer special cases', () => {
        expect(bufToInt(Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff, 0xff]))).toBe(16777215n) // 1-6 bytes
        expect(bufToInt(Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff]))).toBe(16777215n) // 7 bytes
    })

    test('alignment', () => {
        expect(bufToInt(new Uint8Array([0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)

        expect(bufToInt(new Uint8Array([0xe3]))).toBe(0xe3n)
        expect(bufToInt(new Uint8Array([0xe3, 0]))).toBe(0xe300n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0]))).toBe(0xe30000n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0, 0]))).toBe(0xe3000000n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0, 0, 0]))).toBe(0xe300000000n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0]))).toBe(0xe30000000000n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0]))).toBe(0xe3000000000000n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe300000000000000n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe30000000000000000n)
        expect(bufToInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
            0xe3000000000000000000n,
        )

        expect(bufToInt(Buffer.from([0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3n)

        expect(bufToInt(Buffer.from([0xe3]))).toBe(0xe3n)
        expect(bufToInt(Buffer.from([0xe3, 0]))).toBe(0xe300n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0]))).toBe(0xe30000n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0, 0]))).toBe(0xe3000000n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0, 0, 0]))).toBe(0xe300000000n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0, 0, 0, 0]))).toBe(0xe30000000000n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0]))).toBe(0xe3000000000000n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe300000000000000n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe30000000000000000n)
        expect(bufToInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
            0xe3000000000000000000n,
        )

        expect(bufToInt([0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0, 0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0, 0, 0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe3n)
        expect(bufToInt([0, 0, 0, 0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe3n)

        expect(bufToInt([0xe3])).toBe(0xe3n)
        expect(bufToInt([0xe3, 0])).toBe(0xe300n)
        expect(bufToInt([0xe3, 0, 0])).toBe(0xe30000n)
        expect(bufToInt([0xe3, 0, 0, 0])).toBe(0xe3000000n)
        expect(bufToInt([0xe3, 0, 0, 0, 0])).toBe(0xe300000000n)
        expect(bufToInt([0xe3, 0, 0, 0, 0, 0])).toBe(0xe30000000000n)
        expect(bufToInt([0xe3, 0, 0, 0, 0, 0, 0])).toBe(0xe3000000000000n)
        expect(bufToInt([0xe3, 0, 0, 0, 0, 0, 0, 0])).toBe(0xe300000000000000n)
        expect(bufToInt([0xe3, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0xe30000000000000000n)
        expect(bufToInt([0xe3, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0xe3000000000000000000n)
    })
})

describe(leBufToBigInt, () => {
    test('encodeIntLE', () => {
        expect(leBufToBigInt([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff])).toBe(
            18446744069414584320n,
        )
        expect(leBufToBigInt(Buffer.from([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff]))).toBe(
            18446744069414584320n,
        )
        expect(
            leBufToBigInt(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff])),
        ).toBe(18446744069414584320n)
    })

    test('buffer special cases', () => {
        expect(leBufToBigInt(Buffer.from([0x00, 0x00, 0x00, 0xff, 0xff, 0xff]))).toBe(
            281474959933440n,
        )
    })

    test('alignment', () => {
        expect(leBufToBigInt(new Uint8Array([0xe3]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0, 0xe3]))).toBe(0xe300n)
        expect(leBufToBigInt(new Uint8Array([0, 0, 0xe3]))).toBe(0xe30000n)
        expect(leBufToBigInt(new Uint8Array([0, 0, 0, 0xe3]))).toBe(0xe3000000n)
        expect(leBufToBigInt(new Uint8Array([0, 0, 0, 0, 0xe3]))).toBe(0xe300000000n)
        expect(leBufToBigInt(new Uint8Array([0, 0, 0, 0, 0, 0xe3]))).toBe(0xe30000000000n)
        expect(leBufToBigInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3000000000000n)
        expect(leBufToBigInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe300000000000000n)
        expect(leBufToBigInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(
            0xe30000000000000000n,
        )
        expect(leBufToBigInt(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(
            0xe3000000000000000000n,
        )

        expect(leBufToBigInt(new Uint8Array([0xe3]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(new Uint8Array([0xe3, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)

        expect(leBufToBigInt(Buffer.from([0xe3]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0, 0xe3]))).toBe(0xe300n)
        expect(leBufToBigInt(Buffer.from([0, 0, 0xe3]))).toBe(0xe30000n)
        expect(leBufToBigInt(Buffer.from([0, 0, 0, 0xe3]))).toBe(0xe3000000n)
        expect(leBufToBigInt(Buffer.from([0, 0, 0, 0, 0xe3]))).toBe(0xe300000000n)
        expect(leBufToBigInt(Buffer.from([0, 0, 0, 0, 0, 0xe3]))).toBe(0xe30000000000n)
        expect(leBufToBigInt(Buffer.from([0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe3000000000000n)
        expect(leBufToBigInt(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(0xe300000000000000n)
        expect(leBufToBigInt(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(
            0xe30000000000000000n,
        )
        expect(leBufToBigInt(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0xe3]))).toBe(
            0xe3000000000000000000n,
        )

        expect(leBufToBigInt(Buffer.from([0xe3]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)
        expect(leBufToBigInt(Buffer.from([0xe3, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0xe3n)

        expect(leBufToBigInt([0xe3])).toBe(0xe3n)
        expect(leBufToBigInt([0, 0xe3])).toBe(0xe300n)
        expect(leBufToBigInt([0, 0, 0xe3])).toBe(0xe30000n)
        expect(leBufToBigInt([0, 0, 0, 0xe3])).toBe(0xe3000000n)
        expect(leBufToBigInt([0, 0, 0, 0, 0xe3])).toBe(0xe300000000n)
        expect(leBufToBigInt([0, 0, 0, 0, 0, 0xe3])).toBe(0xe30000000000n)
        expect(leBufToBigInt([0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe3000000000000n)
        expect(leBufToBigInt([0, 0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe300000000000000n)
        expect(leBufToBigInt([0, 0, 0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe30000000000000000n)
        expect(leBufToBigInt([0, 0, 0, 0, 0, 0, 0, 0, 0, 0xe3])).toBe(0xe3000000000000000000n)

        expect(leBufToBigInt([0xe3])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0, 0, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0, 0, 0, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0, 0, 0, 0, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0, 0, 0, 0, 0, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0xe3n)
        expect(leBufToBigInt([0xe3, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0xe3n)
    })
})
