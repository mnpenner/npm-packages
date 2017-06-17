import {isArray, isFunction, isNullish, isPlainObject, isString} from './types';
import {getType} from './debug';
import chain from './chain';


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
export function filterMap(iterable: object, callback: (v: any, k: PropertyKey) => any): object;
export function filterMap(iterable: Iterable<any>, callback: (v: any, k: number) => any): any[];
export function filterMap(iterable: any, callback: (v: any, k: any) => any): any {
    if(isPlainObject(iterable)) {
        let accum = Object.create(null);

        // There's lots of ways to iterate an object, hopefully this was a good choice
        // You can't remap the keys with this
        // And the callback takes (value,key) instead of [key,value]
        for(let [k,v] of Object.entries(iterable)) {
            let y = callback(v,k);
            if(y !== __skip__) {
                accum[k] = y;
            }
        }

        return accum;
    } else {
        let accum = [];

        let i = 0;
        for(let x of <Iterable<any>>iterable) {
            let y = callback(x, i++);
            if(y !== __skip__) {
                accum.push(y);
            }
        }

        return accum;
    }
}

export const fmap = chain(filterMap);
