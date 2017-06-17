export function isNativeFunction(obj: any): obj is Function {
    return isFunction(obj) && obj.toString().endsWith('{ [native code] }');
}

export function isFunction(obj: any): obj is Function {
    return typeof obj === 'function';
}

export function isString(obj: any): obj is string {
    return typeof obj === 'string' || obj instanceof String;
}

export function isNumber(obj: any) {
    return typeof obj === 'number' || obj instanceof Number;
}

export function isPromise(obj: any): obj is Promise<any> {
    return obj instanceof Promise;
}

export function isBoolean(obj: any): obj is boolean {
    return obj === true || obj === false; // there's also a `Boolean` type but it doesn't behave much like a boolean
}

export function isRegExp(obj: any): obj is RegExp {
    return obj instanceof RegExp;
}

export function isDate(obj: any): obj is Date {
    return obj instanceof Date;
}

export function isSet(obj: any): obj is Set<any> {
    return obj instanceof Set;
}

export function isMap(obj: any): obj is Map<any,any> {
    return obj instanceof Map;
}

export function isWeakMap(obj: any): obj is WeakMap<any, any> {
    return obj instanceof WeakMap;
}

export function isArray(obj: any): obj is Array<any> {
    return Array.isArray(obj);
}

export function isNull(obj: any): obj is null {
    return obj === null;
}

export function isUndefined(obj: any): obj is undefined {
    return obj === undefined;
}

/**
 * Returns true if a value is null, undefined, or NaN.
 */
export function isNullish(obj: any): obj is null|undefined|number { // the NaN kind of screws up the type checking...
    return obj === null || obj === undefined || obj !== obj;
}

export function isObject(obj: any): obj is object {
    return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj: any): obj is object {
    return isObject(obj) && (
        obj.constructor === Object  // obj = {}
        || obj.constructor === undefined // obj = Object.create(null)
    );
}

export function isSymbol(obj: any): obj is symbol {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
}

declare const BUILD_TARGET: string; // need to actually define this

export function isBuffer(obj: any): obj is Buffer {
    if(BUILD_TARGET === 'node') {
        return Buffer.isBuffer(obj);
    }
    // TODO: should we check if obj is a UInt8Array or something?
    return false;
}

export function isError(obj: any) {
    return obj instanceof Error;
}