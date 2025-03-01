import assert from 'node:assert/strict'

const DEFAULT_ALPHABET = '0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ'

/**
 * Encodes a 16-byte Uint8Array into a string.
 * The bytes are scrambled to make it harder (but not impossible) to extract information from the ID, such as the
 * time or type.
 */
export class ObfusicatedIdEncoder {
    private readonly alphabet: string;
    private readonly base: bigint;
    private readonly reverse: Map<string, bigint>;
    private readonly maxLength: number;

    constructor(private readonly secretKey: Uint8Array, alphabet: string = DEFAULT_ALPHABET) {
        assert(secretKey.length === 16, 'Secret key must be exactly 16 bytes');
        assert(alphabet.length >= 2, 'Alphabet must contain at least 2 characters');
        assert(new Set(alphabet).size === alphabet.length, 'Alphabet must contain unique characters');

        this.alphabet = alphabet;
        this.base = BigInt(alphabet.length);
        this.reverse = new Map(Array.from(alphabet, (v, i) => [v, BigInt(i)]));

        // Calculate max length: ceil(128 / log_2(base))
        const log2Base = Math.log2(Number(this.base));
        this.maxLength = Math.ceil(128 / log2Base);
    }

    encode(id: Uint8Array): string {
        assert(id.length === 16, 'ID must be 16 bytes long');

        const scrambled = new Uint8Array(16);
        for (let i = 0; i < 16; ++i) {
            scrambled[i] = id[i] ^ this.secretKey[i];
        }

        const mixed = new Uint8Array(16);
        mixed.set(scrambled.subarray(7, 14), 0);
        mixed[7] = scrambled[6] ^ scrambled[7];
        mixed.set(scrambled.subarray(0, 6), 8);
        mixed[14] = scrambled[15];
        mixed[15] = scrambled[14] ^ scrambled[13];

        let value = 0n;
        for (let i = 0; i < 16; ++i) {
            value = (value << 8n) | BigInt(mixed[i]);
        }

        let result = '';
        do {
            const digit = value % this.base;
            result = this.alphabet[Number(digit)] + result;
            value = value / this.base;
        } while (value > 0n);

        return result.padStart(this.maxLength, this.alphabet[0]);
    }

    get encodedLength(): number {
        return this.maxLength;
    }

    decode(formattedId: string): Uint8Array {
        assert(formattedId.length <= this.maxLength, `Formatted ID must be ${this.maxLength} characters or less`);

        let value = 0n;
        for (const char of formattedId) {
            const digit = this.reverse.get(char);
            assert(digit !== undefined, `Invalid character in ID: ${char}`);
            value = value * this.base + digit;
        }

        const mixed = new Uint8Array(16);
        for (let i = 15; i >= 0; --i) {
            mixed[i] = Number(value & 0xFFn);
            value >>= 8n;
        }

        const scrambled = new Uint8Array(16);
        scrambled.set(mixed.subarray(8, 14), 0);
        scrambled[6] = mixed[7] ^ mixed[0];
        scrambled.set(mixed.subarray(0, 7), 7);
        scrambled[14] = mixed[15] ^ scrambled[13];
        scrambled[15] = mixed[14];

        const id = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            id[i] = scrambled[i] ^ this.secretKey[i];
        }

        return id
    }
}
