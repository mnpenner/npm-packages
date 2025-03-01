import assert from 'node:assert/strict'
import {base36ToBigInt, fromBase64Url, toBase64Url} from './util'

export class ReadableIdEncoder {
    encode(id: Uint8Array): string {
        assert(id.length === 16, 'ID must be 16 bytes long')

        const typeHigh = id[14] & 0x0F
        const typeLow = id[15]
        const typeTag = (typeHigh << 8) | typeLow

        const time =
            (BigInt(id[0]) << 48n) |
            (BigInt(id[1]) << 40n) |
            (BigInt(id[2]) << 32n) |
            (BigInt(id[3]) << 24n) |
            (BigInt(id[4]) << 16n) |
            (BigInt(id[5]) << 8n) |
            BigInt(id[6])

        const randomBytes = new Uint8Array(8)
        randomBytes[0] = id[7]
        randomBytes[1] = id[8]
        randomBytes[2] = id[9]
        randomBytes[3] = id[10]
        randomBytes[4] = id[11]
        randomBytes[5] = id[12]
        randomBytes[6] = id[13]
        randomBytes[7] = id[14] & 0xF0

        const randomBase64 = toBase64Url(randomBytes)
        return `${typeTag.toString(16)}.${time.toString(36)}.${randomBase64}`
    }

    decode(encoded: string): Uint8Array {
        const [typeStr, timeStr, randomBase64] = encoded.split('.')
        if(!typeStr || !timeStr || !randomBase64) {
            throw new Error('Invalid encoded ID format')
        }

        const typeTag = parseInt(typeStr, 16)
        const time = base36ToBigInt(timeStr)
        const randomBytes = fromBase64Url(randomBase64)

        assert(randomBytes.length === 8, 'Invalid random bytes length')

        const id = new Uint8Array(16)
        id[0] = Number((time >> 48n) & 0xFFn)
        id[1] = Number((time >> 40n) & 0xFFn)
        id[2] = Number((time >> 32n) & 0xFFn)
        id[3] = Number((time >> 24n) & 0xFFn)
        id[4] = Number((time >> 16n) & 0xFFn)
        id[5] = Number((time >> 8n) & 0xFFn)
        id[6] = Number(time & 0xFFn)

        id[7] = randomBytes[0]
        id[8] = randomBytes[1]
        id[9] = randomBytes[2]
        id[10] = randomBytes[3]
        id[11] = randomBytes[4]
        id[12] = randomBytes[5]
        id[13] = randomBytes[6]

        const typeHigh = (typeTag >> 8) & 0x0F
        id[14] = (randomBytes[7] & 0xF0) | typeHigh
        id[15] = typeTag & 0xFF

        return id
    }
}
