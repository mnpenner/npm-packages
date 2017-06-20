import {isArray, isFunction, isNullish, isPlainObject, isString} from './types';
import {getType} from './debug';
import chain from './chain';
import {IDictionary} from './type-defs';
import {SpawnSyncReturns} from 'child_process';
import {identity} from './value';
import {allSettled, FULFILLED} from './promise';
import {flatten} from './array';


export const __skip__ = Symbol('skip');

/**
 * Converts any object to an array. In most cases this means
 * expanding the iterable, however, there are a few special cases.
 *
 * `null`, `undefined` and `NaN` will return an empty array.
 * Arrays will be returned as-is to avoid a shallow copy.
 * Strings and non-iterable objects will become one-element arrays.
 */
export function toArray(obj: any): any[] {
    if(isNullish(obj)) {
        return [];
    }
    if(isArray(obj)) {
        return obj;
    }
    if(isString(obj)) {
        return [obj];
    }
    if(isFunction(obj[Symbol.iterator])) {
        return [...obj];
    }
    return [obj];
}

export function toArrayStrict<T>(obj: Iterable<T>): T[] {
    if(obj) {
        if(isArray(obj)) {
            return obj;
        }
        if(isFunction(obj[Symbol.iterator])) {
            return [...obj];
        }
    }
    throw new Error(`Cannot convert ${getType(obj)} to array; it is not iterable.`);
}

export function toSet(obj: any) {
    if(obj instanceof Set) {
        return obj;
    }
    return new Set(toArray(obj));
}

/**
 * Like `Array.prototype.map`, but you may omit entries by returning `__skip__`.
 */
export function filterMap<TVal,TRet>(dict: IDictionary<TVal>, callback: (v: TVal, k: string, d: IDictionary<TVal>) => TRet|symbol): IDictionary<TRet>; 
export function filterMap<TVal,TRet>(iter: Iterable<TVal>, callback: (v: TVal, k: number, i: Iterable<TVal>) => TRet|symbol): TRet[];
export function filterMap<TVal,TRet>(obj: Iterable<TVal>|IDictionary<TVal>, callback: (v: TVal, k: string|number, i: Iterable<TVal>|IDictionary<TVal>) => TRet|symbol): IDictionary<TRet>|TRet[] {
    
    if(isPlainObject(obj)) {
        let accum = Object.create(null);

        // There's lots of ways to iterate an object, hopefully this was a good choice
        // You can't remap the keys with this
        // And the callback takes (value,key) instead of [key,value]
        for(let [k,v] of Object.entries(obj)) {
            let y = callback(v,k,obj);
            if(y !== __skip__) {
                accum[k] = y as TRet;
            }
        }

        return accum;
    } else {
        let accum = [];

        let i = 0;
        for(let x of obj as Iterable<TVal>) {
            let y = callback(x, i++, obj);
            if(y !== __skip__) {
                accum.push(y as TRet);
            }
        }

        return accum;
    }
}

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
    let out = [];
    let i = 0;
    for(let x of iterable) {
        out.push(callback(x, i++, iterable));
    }
    return out;
}

export function filterArray<TVal>(iterable: Iterable<TVal>, callback: (value: TVal, index: number, iterable: Iterable<TVal>) => boolean): TVal[] {
    let out = [];
    let i = 0;
    for(let x of iterable) {
        if(callback(x, i++, iterable)) {
            out.push(x);
        }
    }
    return out;
}

export function filterAsync<TInput,TResult>(iterable: Iterable<TInput>, mapCb: MapCallback<TInput,Promise<TResult>>, filterCb: (el: TResult) => boolean = identity): Promise<TInput[]> {
    return Promise.all(mapArray(iterable,mapCb))
        .then(results => filterArray(iterable,(_, i) => filterCb(results[i])));
}

export function filterMapAsync<TVal,TRet>(
    iterable: Iterable<TVal>, 
    callback: MapCallback<TVal,Promise<TRet>|TRet>
) {
    return allSettled(mapArray(iterable, callback))
        .then(array => filterMap(array, r => r.state === FULFILLED ? r.value : __skip__))
}

/**
 * Map and flatten
 */
export function flatMap<TVal,TRet>(
    iterable: Iterable<TVal>, 
    callback: MapCallback<TVal,TRet[]|TRet>
): TRet[] {
    return flatten(mapArray(iterable,callback));
}

export type ReduceCallback<TVal,TAcc> 
    = (accumulator: TAcc, currentValue: TVal, currentIndex: number, array: TVal[]) => TAcc

// export type ReduceCallback<TVal,TAcc=TVal> = (accumulator: TAcc, currentValue: TVal, currentIndex: number, array: TVal[]) => TAcc;


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
    let arr = toArrayStrict(iterable);
    if(initialValue === undefined) {
        return arr.reduce(callback); // `initialValue` arg has to be fully omitted
    }
    return arr.reduce(callback, initialValue);
}


export function groupBy<T>(
    iterable: Iterable<T>, 
    grouper: (val: T, idx: number, iter: Iterable<T>) => PropertyKey
): IDictionary<T[]> {
    return reduceArray<T,IDictionary<T[]>>(iterable, (acc, val, idx) => {
        let key = grouper(val, idx, iterable);
        if (acc[key]) {
            acc[key].push(val);
        } else {
            acc[key] = [val];
        }
        return acc;
    }, Object.create(null));
}