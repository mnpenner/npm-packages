/**
 * Flattens an array of arrays into a single array.
 * @param arrayOfArrays - The array to flatten.
 * @returns A new flattened array.
 * @deprecated Use [`Array.prototype.flat`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat} instead.
 */
export function flatten<T>(arrayOfArrays: Array<Array<T> | T>): Array<T> {
    return Array.prototype.concat(...arrayOfArrays)
}
