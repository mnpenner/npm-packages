import assert from 'node:assert/strict';

const DEFAULT_ALPHABET = '0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ';

/**
 * Encodes a 16-byte Uint8Array into a string and decodes it back.
 * The bytes are scrambled using a secret key, S-box, and permutation to obfuscate the ID.
 */
export class ObfuscatedIdEncoder {
    private readonly secretKey: Uint8Array;
    private readonly alphabet: string;
    private readonly base: bigint;
    private readonly reverse: Map<string, bigint>;
    private readonly maxLength: number;
    private readonly sbox: Uint8Array;
    private readonly invSbox: Uint8Array;
    private readonly permutation: Uint8Array;
    private readonly invPermutation: Uint8Array;

    /**
     * Constructs an encoder with a secret key and an optional alphabet.
     * @param secretKey - A 16-byte key for obfuscation.
     * @param alphabet - Characters to use for encoding (defaults to DEFAULT_ALPHABET).
     */
    constructor(secretKey: Uint8Array, alphabet: string = DEFAULT_ALPHABET) {
        // Validate inputs
        assert(secretKey.length === 16, 'Secret key must be exactly 16 bytes');
        assert(alphabet.length >= 2, 'Alphabet must contain at least 2 characters');
        assert(new Set(alphabet).size === alphabet.length, 'Alphabet must contain unique characters');

        this.secretKey = secretKey;
        this.alphabet = alphabet;
        this.base = BigInt(alphabet.length);
        this.reverse = new Map(Array.from(alphabet, (v, i) => [v, BigInt(i)]));
        const log2Base = Math.log2(Number(this.base));
        this.maxLength = Math.ceil(128 / log2Base);

        // Generate S-box and its inverse
        this.sbox = this.generateSbox();
        this.invSbox = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            this.invSbox[this.sbox[i]] = i;
        }

        // Generate permutation and its inverse
        this.permutation = this.generatePermutation();
        this.invPermutation = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            this.invPermutation[this.permutation[i]] = i;
        }
    }

    private generateSbox(): Uint8Array {
        const sbox = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            sbox[i] = i;
        }
        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + sbox[i] + this.secretKey[i % 16]) % 256;
            const temp = sbox[i];
            sbox[i] = sbox[j];
            sbox[j] = temp;
        }
        return sbox;
    }

    private generatePermutation(): Uint8Array {
        const permutation = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            permutation[i] = i;
        }
        for (let i = 15; i > 0; i--) {
            const keyByte = this.secretKey[i % 16];
            const j = keyByte % (i + 1);
            const temp = permutation[i];
            permutation[i] = permutation[j];
            permutation[j] = temp;
        }
        return permutation;
    }

    /**
     * Encodes a 16-byte ID into an obfuscated string.
     * @param id - The 16-byte ID to encode.
     * @returns An encoded string of length maxLength.
     */
    encode(id: Uint8Array): string {
        assert(id.length === 16, 'ID must be 16 bytes long');

        // Step 1: XOR with secret key
        const scrambled = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            scrambled[i] = id[i] ^ this.secretKey[i];
        }

        // Step 2: Apply S-box
        const sboxed = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            sboxed[i] = this.sbox[scrambled[i]];
        }

        // Step 3: Apply permutation
        const mixed = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            mixed[i] = sboxed[this.permutation[i]];
        }

        // Step 4: Convert to big integer (big-endian)
        let value = 0n;
        for (let i = 0; i < 16; i++) {
            value = (value << 8n) | BigInt(mixed[i]);
        }

        // Step 5: Convert to string using alphabet
        let result = '';
        do {
            const digit = value % this.base;
            result = this.alphabet[Number(digit)] + result;
            value = value / this.base;
        } while (value > 0n);

        // Pad to maxLength with the first character
        return result.padStart(this.maxLength, this.alphabet[0]);
    }

    /**
     * Decodes an obfuscated string back to the original 16-byte ID.
     * @param formattedId - The encoded string to decode.
     * @returns The original 16-byte ID.
     */
    decode(formattedId: string): Uint8Array {
        assert(formattedId.length <= this.maxLength, `Formatted ID must be ${this.maxLength} characters or less`);

        // Step 1: Convert string to big integer
        let value = 0n;
        for (const char of formattedId) {
            const digit = this.reverse.get(char);
            assert(digit !== undefined, `Invalid character in ID: ${char}`);
            value = value * this.base + digit;
        }

        // Step 2: Convert big integer to bytes (big-endian)
        const mixed = new Uint8Array(16);
        for (let i = 15; i >= 0; i--) {
            mixed[i] = Number(value & 0xFFn);
            value >>= 8n;
        }

        // Step 3: Apply inverse permutation
        const sboxed = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            sboxed[i] = mixed[this.invPermutation[i]];
        }

        // Step 4: Apply inverse S-box
        const scrambled = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            scrambled[i] = this.invSbox[sboxed[i]];
        }

        // Step 5: XOR with secret key to recover ID
        const id = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            id[i] = scrambled[i] ^ this.secretKey[i];
        }

        return id;
    }
}
