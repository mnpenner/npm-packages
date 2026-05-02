/**
 * Flattens an array of arrays into a single array.
 * @param arrayOfArrays - The array to flatten.
 * @returns A new flattened array.
 */
export function flatten<T>(arrayOfArrays: Array<Array<T> | T>): Array<T> {
    return Array.prototype.concat(...arrayOfArrays);
}