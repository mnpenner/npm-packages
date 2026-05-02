import {isArray, isIterable, isNilOrNaN, isPlainObject, isString} from '@mpen/is-type';
import {getType} from '../Dbg/shared';
import chain from '../Seq';
import type {IDictionary} from '../interfaces';
import {allSettled, FULFILLED} from '../Lang/promise';
import {flatten} from '../Arr';


/**
 * Represents a signal to skip the current iteration in a loop or filter.
 */
export const SKIP: unique symbol = Symbol('SKIP');

/**
 * Converts any object to an array. In most cases this means
 * expanding the iterable, however, there are a few special cases.
 *
 * `null`, `undefined` and `NaN` will return an empty array.
 * Arrays will be returned as-is to avoid a shallow copy.
 * Strings and non-iterable objects will become one-element arrays.
 * 
 * @param obj - The value to convert.
 * @returns An array.
 * @example
 * ```ts
 * toArray(1); // [1]
 * toArray([1]); // [1]
 * toArray(null); // []
 * ```
 */
export function toArray(obj: any): any[] {
    if(isNilOrNaN(obj)) {
        return [];
    }

    if(isArray(obj)) {
        return obj;
    }
    if(isString(obj)) {
        return [obj];
    }
    if(isIterable(obj)) {
        return [...obj];
    }
    return [obj];
}

/**
 * Converts an iterable to an array. Throws if not iterable.
 * @param obj - The iterable to convert.
 * @returns An array.
 * @throws Error if not iterable.
 */
export function toArrayStrict<T>(obj: Iterable<T>): T[] {
    if(obj) {
        if(isArray(obj)) {
            return obj as T[];
        }
        if(isIterable(obj)) {
            return [...obj];
        }
    }
    throw new Error(`Cannot convert ${getType(obj)} to array; it is not iterable.`);
}

/**
 * Converts a value to a Set.
 * @param obj - The value to convert.
 * @returns A Set.
 */
export function toSet(obj: any) {
    if(obj instanceof Set) {
        return obj;
    }
    return new Set(toArray(obj));
}

/**
 * Like `Array.prototype.map`, but you may omit entries by returning `SKIP`.
 * @param obj - The collection to map.
 * @param callback - The mapping function.
 * @returns The mapped collection.
 */
export function filterMap<TVal,TRet>(dict: IDictionary<TVal>, callback: (v: TVal, k: string, d: IDictionary<TVal>) => TRet|symbol): IDictionary<TRet>; 
export function filterMap<TVal,TRet>(iter: Iterable<TVal>, callback: (v: TVal, k: number, i: Iterable<TVal>) => TRet|symbol): TRet[];
export function filterMap<TVal,TRet>(obj: any, callback: (...args: any[]) => any): any {
    
    if(isPlainObject(obj)) {
        const accum = Object.create(null);

        // There's lots of ways to iterate an object, hopefully this was a good choice
        // You can't remap the keys with this
        // And the callback takes (value,key) instead of [key,value]
        for(const [k,v] of Object.entries(obj)) {
            const y = callback(v,k,obj);
            if(y !== SKIP) {
                accum[k] = y as TRet;
            }
        }

        return accum;
    } else {
        const accum = [];

        let i = 0;
        for(const x of obj as Iterable<TVal>) {
            const y = callback(x, i++, obj);
            if(y !== SKIP) {
                accum.push(y as TRet);
            }
        }

        return accum;
    }
}

/** @internal */
export const fmap = chain(filterMap);


// TODO: need to rethink these functions. should they always return arrays, regardless of input type? should they support objects? should they use `this`?

export type MapCallback<TVal,TRet> = (value: TVal, index: number, iterable: Iterable<TVal>) => TRet;

/**
 * Creates a new array with the results of calling a provided function on every element of an iterable.
 *
 * @param iterable Any iterable object.
 * @param callback Function that produces an element of the new Array, taking one argument: the current element being processed.
 */
export function mapArray<TVal,TRet>(iterable: Iterable<TVal>, callback: MapCallback<TVal,TRet>): TRet[] {
    const out = [];
    let i = 0;
    for(const x of iterable) {
        out.push(callback(x, i++, iterable));
    }
    return out;
}

/**
 * Filters an iterable into an array.
 * @param iterable - The iterable to filter.
 * @param callback - The filter function.
 * @returns The filtered array.
 */
export function filterArray<TVal>(iterable: Iterable<TVal>, callback: (value: TVal, index: number, iterable: Iterable<TVal>) => boolean): TVal[] {
    const out = [];
    let i = 0;
    for(const x of iterable) {
        if(callback(x, i++, iterable)) {
            out.push(x);
        }
    }
    return out;
}

/**
 * Asynchronously filters an iterable.
 * @param iterable - The iterable to filter.
 * @param mapCb - Async mapping function.
 * @param filterCb - Sync filter function.
 * @returns Promise resolving to filtered array.
 */
export function filterAsync<TInput,TResult>(iterable: Iterable<TInput>, mapCb: MapCallback<TInput,Promise<TResult>>, filterCb: (el: TResult) => boolean = (el: any) => !!el): Promise<TInput[]> {
    return Promise.all(mapArray(iterable,mapCb))
        .then(results => filterArray(iterable,(_, i) => filterCb(results[i])));
}

/**
 * Asynchronously maps and filters an iterable.
 * @param iterable - The iterable to map.
 * @param callback - Async mapping function.
 * @returns Promise resolving to filtered array.
 */
export function filterMapAsync<TVal,TRet>(
    iterable: Iterable<TVal>, 
    callback: MapCallback<TVal,Promise<TRet>|TRet>
) {
    return allSettled(mapArray(iterable, callback))
        .then(array => filterMap(array, r => r.state === FULFILLED ? r.value : SKIP))
}

/**
 * Map and flatten.
 * @param iterable - The iterable to map.
 * @param callback - The mapping function.
 * @returns The flattened array.
 */
export function flatMap<TVal,TRet>(
    iterable: Iterable<TVal>, 
    callback: MapCallback<TVal,TRet[]|TRet>
): TRet[] {
    return flatten(mapArray(iterable,callback));
}

export type ReduceCallback<TVal,TAcc> 
    = (accumulator: TAcc, currentValue: TVal, currentIndex: number, array: TVal[]) => TAcc

/**
 * Reduces an iterable into a single value.
 */
export function reduceArray<TVal>(
    iterable: Iterable<TVal>,
    callback: (accumulator: TVal, currentValue: TVal, currentIndex: number, array: TVal[]) => TVal,
    initialValue?: TVal
): TVal;
export function reduceArray<TVal,TAcc>(
    iterable: Iterable<TVal>,
    callback: (accumulator: TAcc, currentValue: TVal, currentIndex: number, array: TVal[]) => TAcc,
    initialValue: TAcc
): TAcc;
export function reduceArray<TVal>(
    iterable: Iterable<TVal>,
    callback: (accumulator: any, currentValue: TVal, currentIndex: number, array: TVal[]) => any,
    initialValue: any
): any
{
    // `reduce` is tricky to implement on arbitrary iterables
    // because if `initialValue` is not provided, we have to treat
    // the first element specially. For simplicity, just convert
    // to an array! N.B. strings will be split into chars.
    const arr = toArrayStrict(iterable);
    if(initialValue === undefined) {
        return arr.reduce(callback); // `initialValue` arg has to be fully omitted
    }
    return arr.reduce(callback, initialValue);
}


/**
 * Groups an iterable by a key.
 * @param iterable - The iterable to group.
 * @param grouper - The grouping function.
 * @returns A dictionary of groups.
 */
export function groupBy<T>(
    iterable: Iterable<T>, 
    grouper: (val: T, idx: number, iter: Iterable<T>) => PropertyKey
): IDictionary<T[]> {
    return reduceArray<T,IDictionary<T[]>>(iterable, (acc, val, idx) => {
        const key = grouper(val, idx, iterable);
        if (acc[key]) {
            acc[key].push(val);
        } else {
            acc[key] = [val];
        }
        return acc;
    }, Object.create(null));
}