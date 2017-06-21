/**
 * Identity function. Returns whatever it's given as-is.
 * 
 * @param arg
 * @returns {T}
 */


import {isFunction} from './is';

export function identity<T>(arg: T): T {
    return arg;
}

/**
 * Unwraps a value. If passed a function, evaluates that function with the provided args. Otherwise, returns the value as-is.
 */
export function value<T>(this: any, functionOrValue: (...args: any[]) => T|T, ...args: any[]): T {
    return isFunction(functionOrValue) ? functionOrValue.call(this, ...args) : functionOrValue;
}

/**
 * No operation. Does nothing.
 */
export function noop() {}

/**
 * An immutable empty array.
 * @type {ReadonlyArray<void>}
 */
export const EMPTY_ARRAY = Object.freeze([]);

/**
 * An immutable empty object.
 * @type {Readonly<object>}
 */
export const EMPTY_OBJECT = Object.freeze(Object.create(null));

/**
 * Returns a new object without a prototype from an array of entries.
 */
export function obj<T>(entries?: [T,PropertyKey][]) {
    let o = Object.create(null);
    if(!entries || !entries.length) {
        return o;
    }
    for(let [k,v] of entries) {
        o[k] = v;
    }
    return o;
}