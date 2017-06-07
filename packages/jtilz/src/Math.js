/**
 * Divide numbers and get quotient and remainder.
 * 
 * @param {Number} n The number being divided.
 * @param {Number} d The number that `n` is being divided by.
 * @returns {[Number,Number]}
 */
export function divQR(n, d) {
    let q = Math.trunc(n/d);
    let r = n - (q*d);
    return [q,r];
}

/**
 * Split a number into whole and fractional parts.
 *
 * @param {Number} n
 * @returns {[Number,Number]}
 */
export function wholeFrac(n) {
    let w = Math.trunc(n);
    let f = n - w;
    return [w,f];
}
