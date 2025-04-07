// Define the Base50 alphabet (50 unique characters)
// Example: excludes 0, O, I, l, 1 (visually similar) and some others.
// You can customize this alphabet if needed.
const BASE50_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = BigInt(BASE50_ALPHABET.length); // Should be 50n

// --- Helper: Create a reverse lookup map for decoding ---
const BASE50_MAP: { [char: string]: number } = {};
for (let i = 0; i < BASE50_ALPHABET.length; i++) {
    BASE50_MAP[BASE50_ALPHABET[i]] = i;
}
// ---

/**
 * Encodes a Uint8Array buffer into a Base50 string.
 *
 * @param buffer The Uint8Array to encode.
 * @returns The Base50 encoded string.
 */
export function uint8ArrayToBase50(buffer: Uint8Array): string {
    if (buffer.length === 0) {
        return "";
    }

    // 1. Convert Uint8Array (Base256) to a BigInt
    let num = 0n;
    for (const byte of buffer) {
        num = (num << 8n) + BigInt(byte); // Or: num = num * 256n + BigInt(byte);
    }

    // 2. Convert BigInt to Base50 representation
    let encoded = '';
    while (num > 0n) {
        const remainder = num % BASE;
        num = num / BASE;
        encoded = BASE50_ALPHABET[Number(remainder)] + encoded; // Prepend
    }

    // 3. Handle leading zeros in the original buffer
    // Leading zero bytes (value 0) in input correspond to
    // the first character ('2' in this alphabet) in output.
    const firstChar = BASE50_ALPHABET[0];
    let leadingZeros = 0;
    for (const byte of buffer) {
        if (byte === 0) {
            leadingZeros++;
        } else {
            break; // Stop at the first non-zero byte
        }
    }

    return firstChar.repeat(leadingZeros) + encoded;
}

/**
 * Decodes a Base50 string back into a Uint8Array.
 *
 * @param str The Base50 encoded string.
 * @returns The decoded Uint8Array.
 * @throws Error if the string contains invalid Base50 characters.
 */
export function base50ToUint8Array(str: string): Uint8Array {
    if (str.length === 0) {
        return new Uint8Array();
    }

    // 1. Count and handle leading 'first characters' (representing zero bytes)
    const firstChar = BASE50_ALPHABET[0];
    let leadingZeros = 0;
    for (let i = 0; i < str.length && str[i] === firstChar; i++) {
        leadingZeros++;
    }

    // 2. Convert Base50 string (excluding leading zeros) to BigInt
    let num = 0n;
    for (let i = leadingZeros; i < str.length; i++) {
        const char = str[i];
        const value = BASE50_MAP[char];

        if (value === undefined) {
            throw new Error(`Invalid Base50 character found: "${char}"`);
        }

        num = num * BASE + BigInt(value);
    }

    // 3. Convert BigInt back to Base256 (bytes)
    const bytes: number[] = [];
    while (num > 0n) {
        const remainder = num % 256n;
        bytes.push(Number(remainder));
        num = num / 256n;
    }

    // Bytes are in reverse order, reverse them
    bytes.reverse();

    // 4. Prepend the leading zero bytes and create Uint8Array
    const finalBytes = new Uint8Array(leadingZeros + bytes.length);
    // Leading zeros are already 0 by default in Uint8Array initialization
    finalBytes.set(bytes, leadingZeros); // Place decoded bytes after leading zeros

    return finalBytes;
}

// --- Example Usage ---
const originalData = new Uint8Array([0, 0, 10, 20, 30, 255, 128]);
console.log("Original Uint8Array:", originalData);

const encodedString = uint8ArrayToBase50(originalData);
console.log("Base50 Encoded:", encodedString); // Example output might be "225s5Xejoa" (depends on exact alphabet)

try {
    const decodedData = base50ToUint8Array(encodedString);
    console.log("Decoded Uint8Array:", decodedData);

    // Verification
    const isEqual = originalData.length === decodedData.length &&
        originalData.every((val, index) => val === decodedData[index]);
    console.log("Verification Successful:", isEqual); // Should be true

    // Test edge cases
    console.log("\n--- Edge Cases ---");
    const empty = new Uint8Array([]);
    console.log("Empty:", uint8ArrayToBase50(empty), base50ToUint8Array(""));
    const zeros = new Uint8Array([0, 0, 0]);
    console.log("Zeros:", uint8ArrayToBase50(zeros), base50ToUint8Array(uint8ArrayToBase50(zeros)));
    const singleByte = new Uint8Array([42]);
    console.log("Single Byte:", uint8ArrayToBase50(singleByte), base50ToUint8Array(uint8ArrayToBase50(singleByte)));
    const largeNum = new Uint8Array(Array.from({length: 20}, (_, i) => (i * 13 + 5) % 256));
    console.log("Large Num (start):", largeNum.slice(0, 5), "...");
    const largeEncoded = uint8ArrayToBase50(largeNum);
    console.log("Large Encoded (start):", largeEncoded.substring(0, 10), "...");
    const largeDecoded = base50ToUint8Array(largeEncoded);
    console.log("Large Decoded Matches:", largeNum.every((v, i) => v === largeDecoded[i]));


    // Test invalid character
    console.log("\n--- Error Handling ---");
    try {
        base50ToUint8Array("InvalidChar0");
    } catch (e: any) {
        console.log("Caught expected error:", e.message);
    }

} catch (error) {
    console.error("An error occurred during decoding:", error);
}
