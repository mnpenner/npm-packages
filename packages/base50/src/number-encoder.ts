import {beBufToBigInt, leBufToBigInt} from './buffer-to-bigint'

export class NumberEncoder {
    private readonly alphabet: string[]
    private readonly reverse: Map<string, bigint>
    private readonly base: bigint

    constructor(alphabet: Iterable<string>) {
        this.alphabet = Array.from(alphabet)
        this.reverse = new Map(this.alphabet.map((ch, i) => [ch, BigInt(i)]))
        this.base = BigInt(this.alphabet.length)
    }

    decodeToIntBE(str: ArrayLike<string>): bigint {
        if(!str?.length) return 0n
        str = Array.from(str)
        let result = this.reverse.get(str[0])!
        for(let i = 1; i < str.length; ++i) {
            result = (result << 8n) | this.reverse.get(str[i])!
        }
        return result
    }

    decodeToIntLE(str: ArrayLike<string>): bigint {
        if(!str?.length) return 0n
        str = Array.from(str)
        let result = this.reverse.get(str[str.length - 1])!
        for(let i = str.length - 2; i >= 0; --i) {
            result = (result << 8n) | this.reverse.get(str[i])!
        }
        return result
    }

    encodeInt(num: number | bigint): string {
        let n = BigInt(num)
        if(n === 0n) return this.alphabet[0]
        let result = ''
        while(n > 0n) {
            const rem = n % this.base
            result = this.alphabet[Number(rem)] + result
            n /= this.base
        }
        return result
    }

    // Decodes a custom base string into a Big Endian Uint8Array
    decodeBE(str: ArrayLike<string>): Uint8Array {
        const strArray = Array.from(str) // Ensure we have an array
        if(!strArray.length) {
            return new Uint8Array([]) // Empty input -> empty output
        }

        // 1. Decode the custom base string to a BigInt
        let num = 0n
        for(const char of strArray) {
            const value = this.reverse.get(char)
            if(value === undefined) {
                throw new Error(`Invalid character '${char}' found in input string.`)
            }
            num = num * this.base + value
        }

        // Handle the zero case explicitly AFTER decoding the string
        // This ensures that the string representing zero (e.g., "0" in base10, alphabet[0])
        // correctly decodes to [0] instead of []
        if(num === 0n) {
            // We need to distinguish between "" decoding to [] and "0" decoding to [0]
            // Since the input string was not empty, it must represent 0.
            return new Uint8Array([0])
        }

        // 2. Convert the BigInt to bytes (Big Endian)
        const bytes: number[] = []
        while(num > 0n) {
            // Extract the least significant byte
            const byte = Number(num & 0xFFn) // Using bitwise AND is common
            // Prepend the byte for Big Endian order
            bytes.unshift(byte)
            // Right shift by 8 bits to process the next byte
            num >>= 8n
        }

        return new Uint8Array(bytes)
    }

    // Decodes a custom base string into a Little Endian Uint8Array
    decodeLE(str: ArrayLike<string>): Uint8Array {
        const strArray = Array.from(str) // Ensure we have an array
        if(!strArray.length) {
            return new Uint8Array([]) // Empty input -> empty output
        }

        // 1. Decode the custom base string to a BigInt (same as decodeBE)
        let num = 0n
        for(const char of strArray) {
            const value = this.reverse.get(char)
            if(value === undefined) {
                throw new Error(`Invalid character '${char}' found in input string.`)
            }
            num = num * this.base + value
        }

        // Handle the zero case explicitly AFTER decoding the string
        if(num === 0n) {
            return new Uint8Array([0])
        }

        // 2. Convert the BigInt to bytes (Little Endian)
        const bytes: number[] = []
        while(num > 0n) {
            // Extract the least significant byte
            const byte = Number(num & 0xFFn)
            // Append the byte for Little Endian order
            bytes.push(byte)
            // Right shift by 8 bits to process the next byte
            num >>= 8n
        }

        return new Uint8Array(bytes)
    }

    encodeBE(buffer: ArrayLike<number>): string {
        return this.encodeInt(beBufToBigInt(buffer))
    }

    encodeLE(buffer: ArrayLike<number>): string {
        return this.encodeInt(leBufToBigInt(buffer))
    }
}
