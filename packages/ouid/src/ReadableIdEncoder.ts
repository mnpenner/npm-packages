import assert from 'node:assert/strict'
import {toBase64Url, fromBase64Url} from './buffer'

export class ReadableIdEncoder {
    encode(id: Uint8Array): string {
        assert(id.length === 16, 'ID must be 16 bytes long')

        const typeHigh = id[14] & 0x0F // Bottom 4 bits of byte 14
        const typeLow = id[15]         // All 8 bits of byte 15
        const typeTag = (typeHigh << 8) | typeLow

        const time =
            (BigInt(id[0]) << 48n) |
            (BigInt(id[1]) << 40n) |
            (BigInt(id[2]) << 32n) |
            (BigInt(id[3]) << 24n) |
            (BigInt(id[4]) << 16n) |
            (BigInt(id[5]) << 8n) |
            BigInt(id[6])

        // Extract 60 bits of random data (7.5 bytes)
        const randomBytes = new Uint8Array(8)
        randomBytes[0] = id[7]
        randomBytes[1] = id[8]
        randomBytes[2] = id[9]
        randomBytes[3] = id[10]
        randomBytes[4] = id[11]
        randomBytes[5] = id[12]
        randomBytes[6] = id[13]
        randomBytes[7] = id[14] & 0xF0 // Top 4 bits only

        const randomBase64 = toBase64Url(randomBytes)
        return `${typeTag.toString(16)}.${time.toString(36)}.${randomBase64}`
    }

    decode(encoded: string): Uint8Array {
        const [typeStr, timeStr, randomBase64] = encoded.split('.')
        if (!typeStr || !timeStr || !randomBase64) {
            throw new Error('Invalid encoded ID format')
        }

        // Parse components
        const typeTag = parseInt(typeStr, 16)
        const time = BigInt(parseInt(timeStr, 36))
        const randomBytes = fromBase64Url(randomBase64)

        assert(randomBytes.length === 8, 'Invalid random bytes length')

        // Construct the 16-byte ID
        const id = new Uint8Array(16)

        // Time bytes (0-6) - keep everything as BigInt until final conversion
        id[0] = Number((time >> 48n) & 0xFFn)
        id[1] = Number((time >> 40n) & 0xFFn)
        id[2] = Number((time >> 32n) & 0xFFn)
        id[3] = Number((time >> 24n) & 0xFFn)
        id[4] = Number((time >> 16n) & 0xFFn)
        id[5] = Number((time >> 8n) & 0xFFn)
        id[6] = Number(time & 0xFFn)

        // Random bytes (7-13)
        id[7] = randomBytes[0]
        id[8] = randomBytes[1]
        id[9] = randomBytes[2]
        id[10] = randomBytes[3]
        id[11] = randomBytes[4]
        id[12] = randomBytes[5]
        id[13] = randomBytes[6]

        // Byte 14: top 4 bits from random, bottom 4 from type
        const typeHigh = (typeTag >> 8) & 0x0F
        id[14] = (randomBytes[7] & 0xF0) | typeHigh

        // Byte 15: low 8 bits of type
        id[15] = typeTag & 0xFF

        return id
    }
}
