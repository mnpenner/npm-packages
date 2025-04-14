
const SUPPORTS_BUFFER = typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function'
const SUPPORTS_DATAVIEW = typeof DataView !== 'undefined' && typeof ArrayBuffer !== 'undefined'

export class NumberEncoder {
    private readonly alphabet: string[]
    private readonly reverse: Map<string, number>

    constructor(alphabet: Iterable<string>) {
        this.alphabet = Array.from(alphabet)
        this.reverse = new Map(this.alphabet.map((ch, i) => [ch, i]))
    }

    /**
     * Encodes an array-like sequence of numbers into a single big-endian integer.
     *
     * Meaning the first byte (left-most; index 0) is the most significant ("biggest") value.
     *
     * @param {ArrayLike<number>} buffer - The input sequence of numbers to be encoded. Each element represents a byte.
     * @return {bigint} The resulting integer encoded in big-endian format.
     */
    static encodeIntBE(buffer: ArrayLike<number>): bigint {
        if(buffer.length === 0) {
            return 0n
        }
        if(buffer.length <= 8) {
            // TODO: pre-check the support and modify the function itself (pull out of class)
            if(SUPPORTS_BUFFER && Buffer.isBuffer(buffer)) {
                if(buffer.length === 8) {
                    return buffer.readBigInt64BE()
                }
                if(buffer.length <= 6) {
                    return BigInt(buffer.readUIntBE(0, buffer.length))
                }
            }
            if(SUPPORTS_DATAVIEW && (buffer as Uint8Array).buffer instanceof ArrayBuffer) {
                // TODO
            }
        }
        let result = 0n
        for(let i = 0; i < buffer.length; ++i) {
            result = (result << 8n) | BigInt(buffer[i])
        }
        return result
    }

    /**
     * Encodes an array-like sequence of numbers into a single big-endian integer.
     *
     * The input buffer can be any number of bytes. It assumed to be unsigned.
     * This is more common than little-endian in modern computing systems.
     *
     * @param {ArrayLike<number>} buffer - The input sequence of numbers to be encoded. Each element represents a byte.
     * @return {bigint} The resulting integer encoded in big-endian format.
     */
    static encodeIntLE(buffer: ArrayLike<number>): bigint {
        if(SUPPORTS_BUFFER && Buffer.isBuffer(buffer) && buffer.length <= 6) {
            return BigInt(buffer.readUIntLE(0, buffer.length))
        }
        let result = 0n
        for(let i = buffer.length - 1; i >= 0; --i) {
            result = (result << 8n) | BigInt(buffer[i])
        }
        return result
    }

    decodeToIntBE(str: string): bigint {

    }

    decodeToIntLE(str: string): bigint {

    }

    encodeBigEndian(buffer: ArrayLike<number>): string {
        if(buffer.length === 0) {
            return ""
        }

        // 1. Count leading zero bytes.
        let zeros = 0
        while(zeros < buffer.length && buffer[zeros] === 0) {
            zeros++
        }

        // 2. Allocate space for conversion - Base256 digits (bytes)
        // We work on a mutable array of numbers
        const digits256: number[] = []
        for(let i = zeros; i < buffer.length; i++) {
            digits256.push(buffer[i])
        }

        // 3. Allocate space for Base50 digits (initially unknown size)
        const digits50: number[] = []

        // 4. Perform base conversion (Base256 -> Base50)
        // Process digits until the number becomes zero
        while(digits256.length > 0) {
            let remainder = 0
            const quotient: number[] = []

            // Long division: Divide digits256 by BASE (50)
            for(let i = 0; i < digits256.length; i++) {
                // Bring down the next digit (effectively multiplying remainder by 256)
                let accumulator = digits256[i] + remainder * 256
                let digit = Math.floor(accumulator / this.alphabet.length)
                remainder = accumulator % this.alphabet.length

                // Add the new quotient digit if it's non-zero or if we have already
                // added non-zero digits previously (to avoid leading zeros in quotient).
                if(quotient.length > 0 || digit > 0) {
                    quotient.push(digit)
                }
            }

            // The final remainder is the next Base50 digit (least significant first)
            digits50.push(remainder)

            // The quotient becomes the number for the next iteration
            digits256.splice(0, digits256.length, ...quotient) // Replace digits256 in place
        }

        // 5. Add leading zero characters
        let result = this.alphabet[0].repeat(zeros)

        // 6. Convert Base50 digits to characters (in reverse order)
        for(let i = digits50.length - 1; i >= 0; i--) {
            result += this.alphabet[digits50[i]]
        }

        return result
    }

    decodeBigEndian(str: string): Uint8Array {
        if(str.length === 0) {
            return new Uint8Array()
        }

        // 1. Count leading 'leader' characters (representing zero bytes)
        let zeros = 0
        while(zeros < str.length && str[zeros] === this.alphabet[0]) {
            zeros++
        }

        // 2. Allocate space for Base50 digits (numeric values)
        const digits50: number[] = []
        for(let i = zeros; i < str.length; i++) {
            const char = str[i]
            const value = this.reverse.get(char)
            if(value === undefined) {
                throw new Error(`Invalid character found: "${char}"`)
            }
            digits50.push(value)
        }

        // 3. Allocate space for Base256 digits (bytes)
        const digits256: number[] = []

        // 4. Perform base conversion (Base50 -> Base256)
        while(digits50.length > 0) {
            let remainder = 0
            const quotient: number[] = []

            // Long division: Divide digits50 by 256
            for(let i = 0; i < digits50.length; i++) {
                // Bring down the next digit (effectively multiplying remainder by BASE=50)
                let accumulator = digits50[i] + remainder * this.alphabet.length
                let digit = Math.floor(accumulator / 256)
                remainder = accumulator % 256

                // Add the new quotient digit if non-zero or if we have seen non-zeros
                if(quotient.length > 0 || digit > 0) {
                    quotient.push(digit)
                }
            }

            // The final remainder is the next Base256 digit (byte, least significant first)
            digits256.push(remainder)

            // The quotient becomes the number for the next iteration
            digits50.splice(0, digits50.length, ...quotient) // Replace digits50 in place
        }

        // 5. Construct the final Uint8Array
        const result = new Uint8Array(zeros + digits256.length)

        // 6. Add leading zeros
        // (Uint8Array is initialized with zeros, so no explicit action needed if zeros > 0)

        // 7. Add the decoded bytes (in reverse order)
        for(let i = 0; i < digits256.length; i++) {
            result[zeros + i] = digits256[digits256.length - 1 - i] // Add in correct order
        }

        return result
    }

}
