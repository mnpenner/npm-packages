// --- Base50 Configuration ---
const BASE50_ALPHABET = '0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ'
const BASE = 50 // Target base
const LEADER = BASE50_ALPHABET.charAt(0) // Character representing zero

// Create reverse lookup map
const BASE50_MAP: { [char: string]: number } = {}
for(let i = 0; i < BASE50_ALPHABET.length; i++) {
    BASE50_MAP[BASE50_ALPHABET[i]] = i
}

// ---

/**
 * Encodes a Uint8Array buffer into a Base50 string using a streaming approach
 * (avoiding conversion to a single large BigInt).
 *
 * @param buffer The Uint8Array to encode.
 * @returns The Base50 encoded string.
 */
export function uint8ArrayToBase50Streaming(buffer: Uint8Array): string {
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
            let digit = Math.floor(accumulator / BASE)
            remainder = accumulator % BASE

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
    let result = LEADER.repeat(zeros)

    // 6. Convert Base50 digits to characters (in reverse order)
    for(let i = digits50.length - 1; i >= 0; i--) {
        result += BASE50_ALPHABET[digits50[i]]
    }

    return result
}


/**
 * Decodes a Base50 string back into a Uint8Array using a streaming approach.
 *
 * @param str The Base50 encoded string.
 * @returns The decoded Uint8Array.
 * @throws Error if the string contains invalid Base50 characters.
 */
export function base50ToUint8ArrayStreaming(str: string): Uint8Array {
    if(str.length === 0) {
        return new Uint8Array()
    }

    // 1. Count leading 'leader' characters (representing zero bytes)
    let zeros = 0
    while(zeros < str.length && str[zeros] === LEADER) {
        zeros++
    }

    // 2. Allocate space for Base50 digits (numeric values)
    const digits50: number[] = []
    for(let i = zeros; i < str.length; i++) {
        const char = str[i]
        const value = BASE50_MAP[char]
        if(value === undefined) {
            throw new Error(`Invalid Base50 character found: "${char}"`)
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
            let accumulator = digits50[i] + remainder * BASE
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


// --- Example Usage (Same as before, just using the streaming functions) ---
console.log("--- Streaming Method ---")
const originalData = new Uint8Array([0, 0, 10, 20, 30, 255, 128])
console.log("Original Uint8Array:", originalData)

const encodedStringStream = uint8ArrayToBase50Streaming(originalData)
console.log("Base50 Encoded (Streaming):", encodedStringStream)

try {
    const decodedDataStream = base50ToUint8ArrayStreaming(encodedStringStream)
    console.log("Decoded Uint8Array (Streaming):", decodedDataStream)

    // Verification
    const isEqualStream = originalData.length === decodedDataStream.length &&
        originalData.every((val, index) => val === decodedDataStream[index])
    console.log("Streaming Verification Successful:", isEqualStream) // Should be true

    // Test edge cases
    console.log("\n--- Streaming Edge Cases ---")
    const empty = new Uint8Array([])
    console.log("Empty:", uint8ArrayToBase50Streaming(empty), base50ToUint8ArrayStreaming(""))
    const zeros = new Uint8Array([0, 0, 0])
    const encodedZeros = uint8ArrayToBase50Streaming(zeros)
    console.log("Zeros:", encodedZeros, base50ToUint8ArrayStreaming(encodedZeros))
    const singleByte = new Uint8Array([42])
    const encodedSingle = uint8ArrayToBase50Streaming(singleByte)
    console.log("Single Byte:", encodedSingle, base50ToUint8ArrayStreaming(encodedSingle))
    const largeNum = new Uint8Array(Array.from({length: 50}, (_, i) => (i * 17 + 9) % 256)) // Larger buffer
    console.log("Large Num (start):", largeNum.slice(0, 5), "...")
    const largeEncodedStream = uint8ArrayToBase50Streaming(largeNum)
    console.log("Large Encoded (start):", largeEncodedStream.substring(0, 10), "...")
    const largeDecodedStream = base50ToUint8ArrayStreaming(largeEncodedStream)
    console.log("Large Decoded Matches:", largeNum.every((v, i) => v === largeDecodedStream[i]))


    // Test invalid character
    console.log("\n--- Streaming Error Handling ---")
    try {
        base50ToUint8ArrayStreaming("InvalidChar0")
    } catch(e: any) {
        console.log("Caught expected error:", e.message)
    }

} catch(error) {
    console.error("An error occurred during streaming decoding:", error)
}
