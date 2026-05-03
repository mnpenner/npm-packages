/**
 * Divide numbers and get quotient and remainder.
 *
 * @param n - The number being divided.
 * @param d - The number that `n` is being divided by.
 * @returns A tuple of [quotient, remainder].
 */
export function divQR(n: number, d: number): [number, number] {
    const q = Math.trunc(n / d)
    const r = n - q * d
    return [q, r]
}

/**
 * Split a number into whole and fractional parts.
 * @param n - The number to split.
 * @returns A tuple of [whole, fractional].
 */
export function wholeFrac(n: number): [number, number] {
    const w = Math.trunc(n)
    const f = n - w
    return [w, f]
}
