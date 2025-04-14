#!bun
import { run, bench, group, do_not_optimize } from 'mitata';
import {randomBytes, randomInt, getRandomValues} from 'crypto'
import {uint8ArrayToBase50} from './gamini-original'
import {uint8ArrayToBase50Streaming} from './gemini50'


// --- Benchmark Setup ---

const sizes = [
    16,    // Small
    256,   // Medium-Small
    1024,  // 1 KiB
    4096   // 4 KiB
];

// Generate random data for each size ONCE to ensure fair comparison
const testData: { [key: number]: Buffer } = {};
console.log("Generating test data...");
for (const size of sizes) {
    testData[size] = randomBytes(size);
    console.log(` - Generated ${size} bytes`);
}
console.log("Test data generated.\nStarting benchmarks...");

// --- Benchmark Execution ---

for (const size of sizes) {
    const buffer = testData[size]; // Use the pre-generated buffer

    bench(`(Size ${size} bytes) uint8ArrayToBase50`, () => {
        uint8ArrayToBase50(buffer);
    });

    bench(`(Size ${size} bytes) uint8ArrayToBase50Streaming`, () => {
        uint8ArrayToBase50Streaming(buffer);
    });

    bench(`(Size ${size} bytes) Node Buffer.toString('base64')`, () => {
        buffer.toString('base64');
    });
}

// Run all defined benchmarks
await run({
    // percentiles: false // Disable percentiles for potentially cleaner output
});
