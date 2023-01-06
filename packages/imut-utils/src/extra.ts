import {Resolvable, resolveValue} from './resolvable'

/**
 * Create a new array of specified length. Initialize all elements with the given value.
 */
export function arrayCreate<T>(length: number, value: Resolvable<T,[number]>): T[] {
    return Array.from({length}, (_,i) => resolveValue(value,i))
}

/**
 * Map over a map (returning an array).
 */
export function mapToArray<K,V,R>(map: Iterable<[K,V]>, callback: (v:V, k:K, i:number)=>R): R[] {
    return Array.from(map, ([k,v],i) => callback(v,k,i))
}

/**
 * Map over a set (returning an array).
 */
export function setToArray<V,R>(set: Iterable<V>, callback: (v:V, i:number)=>R): R[] {
    return Array.from(set, callback)
}

export class AssertionError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);  // 'Error' breaks prototype chain here
        this.name = new.target.name
        Object.setPrototypeOf(this, new.target.prototype);  // restore prototype chain
    }
}


export function assert(condition: any): void|never {
    if(!condition) throw new AssertionError("Assertion failed")
}

// TODO: take in a "compare" func so this works on more than just numbers.
export function binarySearch(nums: number[], target: number): number {
    let left: number = 0;
    let right: number = nums.length - 1;

    while (left <= right) {
        const mid: number = Math.floor((left + right) / 2);

        if (nums[mid] === target) return mid;
        if (target < nums[mid]) right = mid - 1;
        else left = mid + 1;
    }

    return ~left;
}
