/**
 * Identity function. Returns whatever it's given as-is.
 * 
 * @param arg
 * @returns {Type}
 */


import * as Type from './is';

export function identity<T>(arg: T): T {
    return arg;
}

/**
 * Unwraps a value. If passed a function, evaluates that function with the provided args. Otherwise, returns the value as-is.
 */
export function value<T>(this: any, functionOrValue: ((...args: any[]) => T)|T, ...args: any[]): T {
    return Type.isFunction(functionOrValue) ? functionOrValue.call(this, ...args) : functionOrValue;
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

/**
 * Returns `true` for:
 * - null
 * - undefined
 * - NaN
 * - Plain objects without any own enumerable properties
 * - Empty arrays, Sets and Maps
 * - Invalid Dates
 * Returns `false` for everything else.
 */
export function isEmpty(value: any): boolean {
    if(value === null || value === undefined || value !== value) {
        return true;
    }
    if(Type.isArray(value) || Type.isString(value)) {
        return value.length === 0;
    }
    if(Type.isPlainObject(value)) {
        return Object.keys(value).length === 0;
    }
    if(Type.isMap(value) || Type.isSet(value)) {
        return value.size === 0;
    }
    if(Type.isDate(value)) {
        return Type.isNaN(value.valueOf());
    }
    return false;
}

export function clone<T>(value: T): T {
    if(Type.isArray(value)) {
        return [...value];
    }
    if(Type.isDate(value)) {
        return Object.assign(new Date(value.valueOf()),value);
    }
    if(Type.isMap(value) || Type.isSet(value)) {
        return Object.assign(new value.constructor(value),value);
    }
    if(Type.isNumber(value) || Type.isString(value) || Type.isNullish(value) || Type.isBoolean(value) || Type.isSymbol(value)) {
        return value; // these types are immutable. no clone necessary
    }
    if(Type.isRegExp(value)) {
        return Object.assign(new RegExp(value.source, value.flags),value);
    }
    if(Type.isObject(value)) {
        return Object.assign(Object.create(Object.getPrototypeOf(value)), value);
    }
    if(Type.isFunction(value)) {
        if(Type.isNativeFunction(value)) {
            throw new Error(`Cannot clone native functions`);
        }
        const fn = new Function(`return ${value.toString()}`)();
        Object.assign(fn,value);
        return fn;
    }
    // if(Type.isSymbol(value)) {
    //     const key = Symbol.keyFor(value);
    //     if(key !== undefined) {
    //         return Symbol.for(key);
    //     }
    //     throw new Error(`Cannot clone symbols without keys`);
    // }
    throw new Error(`Could not clone value`);
}