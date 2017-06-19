import {isArray, isFunction, isNullish, isPlainObject, isString} from './types';
import {getType} from './debug';
import chain from './chain';
import {IDictionary} from './type-defs';
import {SpawnSyncReturns} from 'child_process';
import {identity} from './value';


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

export function toArrayStrict(obj: Iterable<any>): any[] {
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

/**
 * Like `Array.prototype.map`, but you may omit entries by returning `__skip__`.
 */
export function filterMap<TVal,TRet,TDict extends IDictionary<TVal>>(dict: TDict, callback: (v: TVal, k: string, d: TDict) => TRet|symbol): IDictionary<TRet>; 
export function filterMap<TVal,TRet,TIter extends Iterable<TVal>>(iter: TIter, callback: (v: TVal, k: number, i: TIter) => TRet|symbol): TRet[];
export function filterMap<TVal,TRet>(obj: any, callback: (v: TVal, k: any, i: any) => TRet|symbol): any {
    return isPlainObject(obj)
        ? _fmapObj(obj, callback)
        : _fmapIter(obj, callback);
}

function _fmapObj<TVal,TRet,TDict extends IDictionary<TVal>>(dict: TDict, callback: (v: TVal, k: string, d: TDict) => TRet|symbol): IDictionary<TRet> {
    let accum = Object.create(null);

    // There's lots of ways to iterate an object, hopefully this was a good choice
    // You can't remap the keys with this
    // And the callback takes (value,key) instead of [key,value]
    for(let [k,v] of Object.entries(dict)) {
        let y = callback(v,k,dict);
        if(y !== __skip__) {
            accum[k] = y as TRet;
        }
    }

    return accum;
}

function _fmapIter<TVal,TRet,TIter extends Iterable<TVal>>(iter: TIter, callback: (v: TVal, k: number, i: TIter) => TRet|symbol): TRet[] {
    let accum = [];

    let i = 0;
    for(let x of iter) {
        let y = callback(x, i++, iter);
        if(y !== __skip__) {
            accum.push(y as TRet);
        }
    }

    return accum;
}

export const fmap = chain(filterMap);


// TODO: need to rethink these functions. should they always return arrays, regardless of input type? should they support objects? should they use `this`?

/**
 * Creates a new array with the results of calling a provided function on every element of an iterable.
 *
 * @param iterable Any iterable object.
 * @param callback Function that produces an element of the new Array, taking one argument: the current element being processed.
 */
export function mapArray<TVal,TRet,TIter extends Iterable<TVal>>(iterable: TIter, callback: (value: TVal, index: number, iterable: TIter) => TRet): TRet[] {
    let out = [];
    let i = 0;
    for(let x of iterable) {
        out.push(callback(x, i++, iterable));
    }
    return out;
}

export function filterArray<TVal,TIter extends Iterable<TVal>>(iterable: TIter, callback: (element: TVal, index: number, iterable: TIter) => boolean): TVal[] {
    let out = [];
    let i = 0;
    for(let x of iterable) {
        if(callback(x, i++, iterable)) {
            out.push(x);
        }
    }
    return out;
}

export function filterAsync<TInput,TResult>(iterable: Iterable<TInput>, mapCb: (value: TInput, index: number) => Promise<TResult>, filterCb: (el: TResult) => boolean = identity): Promise<TInput[]> {
    return Promise.all(mapArray(iterable,mapCb))
        .then(results => filterArray(iterable,(_, i) => filterCb(results[i])));
}
