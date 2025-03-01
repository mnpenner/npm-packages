import assert from 'node:assert/strict'

const ALPHABET = '0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ'
const FMT_REGEX = new RegExp(`^[${ALPHABET}]{23}$`)
const BASE = BigInt(ALPHABET.length) // 50
const REVERSE = new Map(Array.from(ALPHABET, (v, i) => [v, BigInt(i)]))

export class IdFormatter {
    constructor(private readonly secretKey: Uint8Array) {
        assert(secretKey.length === 16, 'Secret key must be exactly 16 bytes')
    }

    format(id: Uint8Array): string {
        assert(id.length === 16, 'ID must be 16 bytes long')

        // Step 1: Scramble with the key
        const scrambled = new Uint8Array(16)
        for (let i = 0; i < 16; i++) {
            scrambled[i] = id[i] ^ this.secretKey[i]
        }

        // Step 2: Mix time (bytes 0-6) and random (bytes 7-14) in a reversible way
        const mixed = new Uint8Array(16)
        // Move random (7-13) to start
        mixed.set(scrambled.subarray(7, 14), 0)
        // Mix last time byte with first random byte (reversible)
        mixed[7] = scrambled[6] ^ scrambled[7]
        // Move time (0-5) to middle
        mixed.set(scrambled.subarray(0, 6), 8)
        // Type bytes: keep low byte, mix high byte with last random byte
        mixed[14] = scrambled[15] // Low byte of type
        mixed[15] = scrambled[14] ^ scrambled[13] // High byte of type mixed

        // Step 3: Convert to bigint
        let value = 0n
        for (let i = 0; i < 16; i++) {
            value = (value << 8n) | BigInt(mixed[i])
        }

        // Step 4: Encode to base-50
        let result = ''
        do {
            const digit = value % BASE
            result = ALPHABET[Number(digit)] + result
            value = value / BASE
        } while (value > 0n)

        return result.padStart(23, ALPHABET[0])
    }

    parse(formattedId: string): Uint8Array {
        assert(FMT_REGEX.test(formattedId))

        // Step 1: Decode from base-50 to bigint
        let value = 0n
        for (const char of formattedId) {
            const digit = REVERSE.get(char)!
            // assert(digit !== undefined, `Invalid character in ID: ${char}`)
            value = value * BASE + digit
        }

        // Step 2: Convert bigint to 16-byte array
        const mixed = new Uint8Array(16)
        for (let i = 15; i >= 0; i--) {
            mixed[i] = Number(value & 0xFFn)
            value >>= 8n
        }

        // Step 3: Unmix time and random
        const scrambled = new Uint8Array(16)
        // Restore time bytes 0-5
        scrambled.set(mixed.subarray(8, 14), 0)
        // Restore random bytes 7-13
        scrambled.set(mixed.subarray(0, 7), 7)
        // Unmix last time byte (byte 6)
        scrambled[6] = mixed[7] ^ scrambled[7] // Use restored scrambled[7]
        // Restore type high byte (byte 14)
        scrambled[14] = mixed[15] ^ scrambled[13] // Use restored scrambled[13]
        // Restore type low byte (byte 15)
        scrambled[15] = mixed[14]

        // Step 4: Unscramble with key
        const id = new Uint8Array(16)
        for (let i = 0; i < 16; i++) {
            id[i] = scrambled[i] ^ this.secretKey[i]
        }

        return id
    }
}
