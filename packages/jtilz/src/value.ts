

/**
 * Identity function. Returns whatever it's given as-is.
 * 
 * @param arg
 * @returns {T}
 */
export function identity<T>(arg: T): T {
    return arg;
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