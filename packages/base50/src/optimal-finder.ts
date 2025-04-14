/**
 * Calculates the Greatest Common Divisor (GCD) of two numbers.
 * @param {number} a
 * @param {number} b
 * @returns {number} The GCD of a and b.
 */
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

/**
 * Calculates the Least Common Multiple (LCM) of two numbers.
 * @param {number} a
 * @param {number} b
 * @returns {number} The LCM of a and b.
 */
function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
}

/**
 * Finds the exponent 'k' for a power-of-2 base (N=2^k)
 * that minimizes the LCM with the input byte size (8 bits),
 * effectively minimizing processing block size and potential padding waste.
 *
 * @param {number} [max_k=8] - The maximum value of k to check.
 * @returns {{k: number, N: number, lcm: number}} Object containing the best k,
 *          the corresponding base N=2^k, and the minimum LCM value found.
 *          Returns {k: -1, N: -1, lcm: Infinity} if no valid k is found.
 */
function findOptimalPowerOf2BaseK(max_k = 8) {
    const input_chunk_size = 8; // bits per byte

    let min_lcm_found = Infinity;
    let best_k = -1;

    if (max_k < 1) {
        return { k: -1, N: -1, lcm: Infinity }; // No valid k to check
    }

    for (let k = 1; k <= max_k; k++) {
        const current_lcm = lcm(input_chunk_size, k);

        if (current_lcm < min_lcm_found) {
            min_lcm_found = current_lcm;
            best_k = k;
        } else if (current_lcm === min_lcm_found) {
            // Tie-breaking: Prefer larger k for potentially better density
            best_k = Math.max(best_k, k);
        }
    }

    if (best_k === -1) {
        // This should only happen if max_k < 1, handled above
        return { k: -1, N: -1, lcm: Infinity };
    }

    return {
        k: best_k,
        N: Math.pow(2, best_k), // or 1 << best_k
        lcm: min_lcm_found
    };
}

// --- Example Usage ---

// Find the best k up to k=8 (Base2 to Base256)
const result = findOptimalPowerOf2BaseK(8);
console.log(`Optimal k: ${result.k}`); // Output: Optimal k: 8
console.log(`Corresponding Base N: ${result.N}`); // Output: Corresponding Base N: 256
console.log(`Minimum LCM(8, k): ${result.lcm}`); // Output: Minimum LCM(8, k): 8

// Test with a different max_k
const result16 = findOptimalPowerOf2BaseK(16);
console.log(`\nChecking up to k=16:`);
console.log(`Optimal k: ${result16.k}`); // Output: Optimal k: 8
console.log(`Corresponding Base N: ${result16.N}`); // Output: Corresponding Base N: 256
console.log(`Minimum LCM(8, k): ${result16.lcm}`); // Output: Minimum LCM(8, k): 8

// Example showing a non-optimal k
const k6_lcm = lcm(8, 6); // Base64 uses k=6
console.log(`\nLCM for k=6 (Base64): ${k6_lcm}`); // Output: LCM for k=6 (Base64): 24
const k5_lcm = lcm(8, 5); // Base32 uses k=5
console.log(`LCM for k=5 (Base32): ${k5_lcm}`); // Output: LCM for k=5 (Base32): 40
