import assert from "node:assert/strict"
import {createCipheriv, createDecipheriv} from "node:crypto"

const TWO_128 = 1n << 128n

function bytes16ToBigInt(b: Uint8Array): bigint {
    assert(b.length === 16, "need 16 bytes")
    let x = 0n
    for(let i = 0; i < 16; i++) x = (x << 8n) | BigInt(b[i])
    return x
}

function bigIntToBytes16(x: bigint): Uint8Array {
    assert(x >= 0n && x < TWO_128, "value must be < 2^128")
    const out = new Uint8Array(16)
    for(let i = 15; i >= 0; i--) {
        out[i] = Number(x & 0xffn)
        x >>= 8n
    }
    return out
}

function aesEcbEncrypt16(key16: Uint8Array, plain16: Uint8Array): Uint8Array {
    assert(key16.length === 16, "Secret key must be exactly 16 bytes")
    assert(plain16.length === 16, "ID must be 16 bytes long")
    const cipher = createCipheriv("aes-128-ecb", Buffer.from(key16), null)
    cipher.setAutoPadding(false)
    const out = Buffer.concat([cipher.update(Buffer.from(plain16)), cipher.final()])
    return new Uint8Array(out)
}

function aesEcbDecrypt16(key16: Uint8Array, ct16: Uint8Array): Uint8Array {
    assert(key16.length === 16, "Secret key must be exactly 16 bytes")
    assert(ct16.length === 16, "encoded value must decode to 16 bytes")
    const decipher = createDecipheriv("aes-128-ecb", Buffer.from(key16), null)
    decipher.setAutoPadding(false)
    const out = Buffer.concat([decipher.update(Buffer.from(ct16)), decipher.final()])
    return new Uint8Array(out)
}

export const DEFAULT_ALPHABET =
    "0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ" // 50 chars

/**
 * AES-ECB based obfuscator for 16-byte IDs with base-N encoding.
 * - Deterministic 16->16 mask (confidentiality only; no integrity).
 * - Encodes to fixed length: ceil(128 / log2(base)).
 */
export class ObfuscatedIdEncoder {
    private readonly secretKey: Uint8Array
    private readonly alphabet: string
    private readonly base: bigint
    private readonly reverse: Map<string, bigint>
    private readonly maxLength: number

    constructor(secretKey: Uint8Array, alphabet: string = DEFAULT_ALPHABET) {
        assert(secretKey.length === 16, "Secret key must be exactly 16 bytes")
        assert(alphabet.length >= 2, "Alphabet must contain at least 2 characters")
        assert(new Set(alphabet).size === alphabet.length, "Alphabet must contain unique characters")

        // With base >= 2, a fixed length exists for representing 128-bit values.
        const log2Base = Math.log2(alphabet.length)

        this.secretKey = secretKey
        this.alphabet = alphabet
        this.base = BigInt(alphabet.length)
        this.reverse = new Map(Array.from(alphabet, (ch, i) => [ch, BigInt(i)]))
        this.maxLength = Math.ceil(128 / log2Base)
    }

    /** Encodes a 16-byte ID to a fixed-length string. */
    encode(id: Uint8Array): string {
        assert(id.length === 16, "ID must be 16 bytes long")

        // 1) AES-ECB mask (16 -> 16)
        const masked = aesEcbEncrypt16(this.secretKey, id)

        // 2) Convert 128-bit to base-N string
        let x = bytes16ToBigInt(masked)
        let s = ""
        for(let i = 0; i < this.maxLength; i++) {
            const d = x % this.base
            s = this.alphabet[Number(d)] + s
            x /= this.base
        }
        // If x != 0 here, overflow (base too small or bug)
        assert(x === 0n, "overflow > 128 bits")
        return s // fixed length
    }

    /** Decodes a string (length <= maxLength) back to the original 16-byte ID. */
    decode(formattedId: string): Uint8Array {
        assert(
            formattedId.length <= this.maxLength,
            `Formatted ID must be ${this.maxLength} characters or less`
        )

        // 1) Base-N to bigint
        let x = 0n
        for(const ch of formattedId) {
            const v = this.reverse.get(ch)
            assert(v !== undefined, `Invalid character in ID: ${ch}`)
            x = x * this.base + v
            assert(x < TWO_128, "value exceeds 128 bits")
        }

        // Left-pad semantics: shorter strings are valid (they represent smaller x).
        const masked = bigIntToBytes16(x)

        // 2) AES-ECB unmask
        return aesEcbDecrypt16(this.secretKey, masked)
    }
}
