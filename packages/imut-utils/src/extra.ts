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
