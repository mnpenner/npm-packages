import {randomBytes} from 'crypto'

/**
 * Encodes a byte buffer into a base-N string using BigInt for optimized
 * mathematical base conversion.
 *
 * @param {Uint8Array} buffer The input byte buffer.
 * @param {string} alphabet The characters for the target base N.
 * @returns {string} The base-N encoded string.
 */
function encodeToBaseN_BigInt(buffer, alphabet) {
    const base = BigInt(alphabet.length);
    if (base <= 1n) {
        throw new Error("Alphabet must contain at least 2 characters.");
    }

    // 1. Handle leading zeros (important!)
    let zeros = 0;
    while (zeros < buffer.length && buffer[zeros] === 0) {
        zeros++;
    }

    // 2. Convert the non-zero part of the buffer to a BigInt
    // Treat buffer as big-endian base 256
    let value = 0n;
    for (let i = zeros; i < buffer.length; i++) {
        value = (value << 8n) + BigInt(buffer[i]);
    }

    // 3. Perform base conversion using division and remainder
    let encoded = "";
    while (value > 0n) {
        const remainder = Number(value % base); // Remainder is the digit index
        encoded = alphabet[remainder] + encoded; // Prepend digits
        value = value / base; // Integer division
    }

    // 4. Add characters for leading zeros
    const leader = alphabet[0];
    for (let i = 0; i < zeros; i++) {
        encoded = leader + encoded;
    }

    return encoded === "" && buffer.length > 0 ? leader : encoded; // Handle all-zero input buffer
}

// Example usage: Base50
const base50Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const myBuffer = new Uint8Array([0x00, 0x1A, 0xFB, 0x03, 0xDD]); // Some random bytes with leading zero

const encoded = encodeToBaseN_BigInt(myBuffer, base50Alphabet);
console.log(`Input: ${Buffer.from(myBuffer).toString('hex')}`);
console.log(`Base50: ${encoded}`);

// Performance comparison idea (conceptual, requires benchmark setup)
const largeBuffer = randomBytes(4096);
console.time("BigInt Encode");
encodeToBaseN_BigInt(largeBuffer, base50Alphabet);
console.timeEnd("BigInt Encode");
console.time("BigInt Encode");
largeBuffer.toString('base64');
console.timeEnd("BigInt Encode");
// --> This will be MUCH faster than the O(n^2) BufferEncoder for large inputs
