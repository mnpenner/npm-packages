export function flatten<T>(arrayOfArrays: Array<Array<T> | T>): Array<T> {
    return Array.prototype.concat(...arrayOfArrays);
}