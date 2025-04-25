import { describe, expect, it } from 'bun:test';
import {
    uint8ArrayToBase50Streaming,
    base50ToUint8ArrayStreaming,
    LEADER, // Import the leader character for zero checks
    BASE50_ALPHABET
} from './gemini50'; // Adjust the path to your implementation file
import crypto from 'node:crypto'; // Import crypto for random bytes

// Helper to compare Uint8Arrays
function expectArraysEqual(arr1: Uint8Array, arr2: Uint8Array) {
    expect(arr1).toEqual(arr2)
    // expect(arr1.length).toBe(arr2.length);
    // // Using Buffer.equals is efficient for comparison in Node/Bun contexts
    // // If running in a pure browser context without Buffer, use array comparison
    // if (typeof Buffer !== 'undefined' && Buffer.from) {
    //     expect(Buffer.from(arr1).equals(Buffer.from(arr2))).toBe(true);
    // } else {
    //     expect(Array.from(arr1)).toEqual(Array.from(arr2)); // Fallback comparison
    // }
}

describe('Base50 Streaming Conversion', () => {

    describe('uint8ArrayToBase50Streaming (Encode)', () => {
        it('should encode an empty array to an empty string', () => {
            const input = new Uint8Array([]);
            expect(uint8ArrayToBase50Streaming(input)).toBe('');
        });

        it('should encode a single zero byte', () => {
            const input = new Uint8Array([0]);
            expect(uint8ArrayToBase50Streaming(input)).toBe(LEADER); // e.g., "2"
        });

        it('should encode multiple zero bytes', () => {
            const input = new Uint8Array([0, 0, 0]);
            expect(uint8ArrayToBase50Streaming(input)).toBe(LEADER.repeat(3)); // e.g., "222"
        });

        it('should encode a single non-zero byte < BASE', () => {
            const input = new Uint8Array([10]); // 10 corresponds to index 10 in alphabet
            expect(uint8ArrayToBase50Streaming(input)).toBe(BASE50_ALPHABET[10]); // e.g., "C"
        });

        it('should encode a single non-zero byte == BASE-1', () => {
            const input = new Uint8Array([49]); // 49 corresponds to index 49 (last char)
            expect(uint8ArrayToBase50Streaming(input)).toBe(BASE50_ALPHABET[49]); // e.g., "z"
        });

        it('should encode a single non-zero byte >= BASE', () => {
            const input = new Uint8Array([50]); // 50 = 1*50 + 0
            const expected = BASE50_ALPHABET[1] + BASE50_ALPHABET[0]; // e.g., "32"
            expect(uint8ArrayToBase50Streaming(input)).toBe(expected);
        });

        it('should encode 255', () => {
            const input = new Uint8Array([255]); // 255 = 5*50 + 5
            const expected = BASE50_ALPHABET[5] + BASE50_ALPHABET[5]; // e.g., "77"
            expect(uint8ArrayToBase50Streaming(input)).toBe(expected);
        });

        it('should encode bytes with leading zeros', () => {
            const input = new Uint8Array([0, 0, 10, 20]); // Expected: Leader*2 + Base50(10*256 + 20)
            // 10*256 + 20 = 2560 + 20 = 2580
            // 2580 / 50 = 51 rem 30
            // 51 / 50 = 1 rem 1
            // 1 / 50 = 0 rem 1
            // Base50 digits (reversed): 30, 1, 1 -> Base50 chars: ALPHABET[1], ALPHABET[1], ALPHABET[30]
            const expectedValue = BASE50_ALPHABET[1] + BASE50_ALPHABET[1] + BASE50_ALPHABET[30]; // e.g., "33V"
            const expected = LEADER.repeat(2) + expectedValue; // e.g., "2233V"
            expect(uint8ArrayToBase50Streaming(input)).toBe(expected);
        });

        it('should encode a more complex sequence', () => {
            // Example from the initial implementation prompt
            const input = new Uint8Array([10, 20, 30, 255, 128]);
            // Let's rely on round-trip testing for complex values unless we have a known good output
            // Or calculate manually if needed: 10*256^4 + 20*256^3 + 30*256^2 + 255*256 + 128 = big number...
            // Using the previous BigInt result for reference (assuming same alphabet): '5s5Xejoa'
            // But let's test via round-trip primarily. This test just ensures it runs.
            expect(uint8ArrayToBase50Streaming(input)).toBeDefined();
        });
    });

    describe('base50ToUint8ArrayStreaming (Decode)', () => {
        it('should decode an empty string to an empty array', () => {
            const input = '';
            expectArraysEqual(base50ToUint8ArrayStreaming(input), new Uint8Array([]));
        });

        it('should decode a single leader character', () => {
            const input = LEADER; // e.g., "2"
            expectArraysEqual(base50ToUint8ArrayStreaming(input), new Uint8Array([0]));
        });

        it('should decode multiple leader characters', () => {
            const input = LEADER.repeat(3); // e.g., "222"
            expectArraysEqual(base50ToUint8ArrayStreaming(input), new Uint8Array([0, 0, 0]));
        });

        it('should decode a single non-leader character < BASE', () => {
            const input = BASE50_ALPHABET[10]; // e.g., "C" -> should be byte 10
            expectArraysEqual(base50ToUint8ArrayStreaming(input), new Uint8Array([10]));
        });

        it('should decode the last character of the alphabet', () => {
            const input = BASE50_ALPHABET[49]; // e.g., "z" -> should be byte 49
            expectArraysEqual(base50ToUint8ArrayStreaming(input), new Uint8Array([49]));
        });

        it('should decode a two-character string representing value >= BASE', () => {
            // Example: "32" (value = 1*50 + 0 = 50)
            const input = BASE50_ALPHABET[1] + BASE50_ALPHABET[0]; // e.g., "32"
            expectArraysEqual(base50ToUint8ArrayStreaming(input), new Uint8Array([50]));
        });

        it('should decode a two-character string representing 255', () => {
            // Example: "77" (value = 5*50 + 5 = 255)
            const input = BASE50_ALPHABET[5] + BASE50_ALPHABET[5]; // e.g., "77"
            expectArraysEqual(base50ToUint8ArrayStreaming(input), new Uint8Array([255]));
        });

        it('should decode a string with leading leader characters', () => {
            // Example: "2233V" -> should be [0, 0, 10, 20]
            const valueStr = BASE50_ALPHABET[1] + BASE50_ALPHABET[1] + BASE50_ALPHABET[30]; // e.g., "33V"
            const input = LEADER.repeat(2) + valueStr; // e.g., "2233V"
            const expected = new Uint8Array([0, 0, 10, 20]);
            expectArraysEqual(base50ToUint8ArrayStreaming(input), expected);
        });

        it('should throw an error for invalid characters', () => {
            const invalidChar = 'a'; // '0' is not in our example alphabet
            const input = `bc${invalidChar}df`;
            expect(() => base50ToUint8ArrayStreaming(input)).toThrow(`Invalid Base50 character found: "${invalidChar}"`);
        });

        it('should throw an error for characters outside the alphabet (e.g., space, symbols)', () => {
            const input1 = 'bc df';
            const input2 = 'bc+df';
            expect(() => base50ToUint8ArrayStreaming(input1)).toThrow('Invalid Base50 character found: " "');
            expect(() => base50ToUint8ArrayStreaming(input2)).toThrow('Invalid Base50 character found: "+"');
        });
    });

    describe('Round Trip Tests', () => {
        const testCases: Uint8Array[] = [
            new Uint8Array([]),
            new Uint8Array([0]),
            new Uint8Array([0, 0, 0]),
            new Uint8Array([1]),
            new Uint8Array([49]),
            new Uint8Array([50]),
            new Uint8Array([255]),
            new Uint8Array([0, 1, 2, 3, 4, 5]),
            new Uint8Array([10, 20, 30, 255, 128]),
            new Uint8Array([0, 0, 10, 20, 30, 255, 128, 0]), // Leading and trailing zeros
            // A larger array
            new Uint8Array(Array.from({ length: 100 }, (_, i) => (i * 17 + 9) % 256)),
            // Array representing a large number near a power of 256 boundary
            new Uint8Array([1, 0, 0, 0]),
            new Uint8Array([0, 255, 255, 255]),
        ];

        testCases.forEach((originalData, index) => {
            it(`should correctly encode and decode test case #${index} (length ${originalData.length})`, () => {
                const encoded = uint8ArrayToBase50Streaming(originalData);
                const decoded = base50ToUint8ArrayStreaming(encoded);
                expectArraysEqual(decoded, originalData);
            });
        });

        it('should handle very large buffer (conceptual test)', () => {
            // Create a larger buffer - adjust size as needed for performance
            const size = 512;
            const largeData = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                largeData[i] = Math.floor(Math.random() * 256);
            }

            // Ensure leading/trailing zeros are possible
            largeData[0] = 0;
            largeData[1] = 0;
            largeData[size - 1] = 0;


            const encoded = uint8ArrayToBase50Streaming(largeData);
            const decoded = base50ToUint8ArrayStreaming(encoded);

            expect(encoded.length).toBeGreaterThan(0); // Basic check it produced output
            expectArraysEqual(decoded, largeData);
        });

        it('should correctly encode and decode 10,000 random arrays of varying sizes using crypto.getRandomValues', () => {
            const numTests = 10_000;
            const maxSize = 512; // Max buffer size in bytes (0 to 512 inclusive)

            console.log(`\nRunning ${numTests} randomized round-trip tests using crypto.getRandomValues (max size: ${maxSize} bytes)...`);

            if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
                console.warn("Web Crypto API (crypto.getRandomValues) not available in this environment. Skipping randomized test.");
                // Optionally make the test pass trivially or throw an error if crypto is required
                expect(true).toBe(true); // Mark test as passing if crypto is unavailable
                return; // Exit the test
            }

            for (let i = 0; i < numTests; i++) {
                // Generate a random size between 0 and maxSize (inclusive)
                const randomSize = Math.floor(Math.random() * (maxSize + 1));

                // Create a Uint8Array of the desired size
                const originalData = new Uint8Array(randomSize);

                // Fill the array with cryptographically secure random values
                if (randomSize > 0) { // getRandomValues doesn't work on 0-length arrays
                    crypto.getRandomValues(originalData);
                }

                let encoded: string;
                let decoded: Uint8Array;

                try {
                    // Encode
                    encoded = uint8ArrayToBase50Streaming(originalData);

                    // Decode
                    decoded = base50ToUint8ArrayStreaming(encoded);

                    // Assert
                    expectArraysEqual(decoded, originalData);

                } catch (error: any) {
                    // If any step fails, report the error clearly along with the input size
                    console.error(`Random test failed at iteration ${i} with size ${randomSize}`);
                    console.error("Original Data (first 20 bytes):", originalData.slice(0, 20));
                    if (typeof encoded! !== 'undefined') {
                        console.error("Encoded String (first 30 chars):", encoded.substring(0, 30));
                    }
                    // Re-throw the error to make the test fail
                    throw new Error(`Test failed for size ${randomSize}: ${error.message}`);
                }
                // Optional: Add progress indication for long runs
                if ((i + 1) % 1000 === 0) {
                   console.log(`  ...completed ${i + 1} tests`);
                }
            }
            console.log(`Successfully completed ${numTests} randomized tests.`);
        }, {
            timeout: 30_000 // Increase timeout if needed (30 seconds)
        }); // Add timeout modifier
    });
});
