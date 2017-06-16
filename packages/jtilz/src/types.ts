export function isNativeFunction(obj: any): boolean {
    return isFunction(obj) && obj.toString().endsWith('{ [native code] }');
}

export function isFunction(obj: any) {
    return typeof obj === 'function';
}

export function isString(obj: any) {
    return typeof obj === 'string' || obj instanceof String;
}

export function isNumber(obj: any) {
    return typeof obj === 'number' || obj instanceof Number;
}

export function isPromise(obj: any) {
    return obj instanceof Promise;
}

export function isBoolean(obj: any) {
    return obj === true || obj === false; // there's also a `Boolean` type but it doesn't behave much like a boolean
}

export function isRegExp(obj: any) {
    return obj instanceof RegExp;
}

export function isDate(obj: any) {
    return obj instanceof Date;
}

export function isSet(obj: any) {
    return obj instanceof Set;
}

export function isMap(obj: any) {
    return obj instanceof Map;
}

export function isWeakMap(obj: any) {
    return obj instanceof WeakMap;
}

export function isArray(obj: any) {
    return Array.isArray(obj);
}

export function isNull(obj: any) {
    return obj === null;
}

export function isUndefined(obj: any) {
    return obj === undefined;
}

/**
 * Returns true if a value is null, undefined, or NaN.
 */
export function isNullish(obj: any) {
    return obj === null || obj === undefined || obj !== obj;
}

export function isObject(obj: any) {
    return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj: any) {
    return isObject(obj) && (
        obj.constructor === Object  // obj = {}
        || obj.constructor === undefined // obj = Object.create(null)
    );
}

export function isSymbol(obj: any) {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
}

export function isBuffer(obj: any) {
    // if(BUILD_TARGET === 'node') {
    //     return Buffer.isBuffer(obj);
    // }
    // TODO: should we check if obj is a UInt8Array or something?
    return false;
}

export function isError(obj: any) {
    return obj instanceof Error;
}