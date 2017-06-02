export function isNativeFunction(obj) {
    return isFunction(obj) && obj.toString().endsWith('{ [native code] }');
}

export function isFunction(obj) {
    return typeof obj === 'function';
}

export function isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
}

export function isNumber(obj) {
    return typeof obj === 'number' || obj instanceof Number;
}

export function isPromise(obj) {
    return obj instanceof Promise;
}

export function isBoolean(obj) {
    return obj === true || obj === false; // there's also a `Boolean` type but it doesn't behave much like a boolean
}

export function isRegExp(obj) {
    return obj instanceof RegExp;
}

export function isDate(obj) {
    return obj instanceof Date;
}

export function isSet(obj) {
    return obj instanceof Set;
}

export function isMap(obj) {
    return obj instanceof Map;
}

export function isWeakMap(obj) {
    return obj instanceof WeakMap;
}

export function isArray(obj) {
    return Array.isArray(obj);
}

export function isNull(obj) {
    return obj === null;
}

export function isUndefined(obj) {
    return obj === undefined;
}

export function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj) {
    return isObject(obj) && (
        obj.constructor === Object  // obj = {}
        || obj.constructor === undefined // obj = Object.create(null)
    );
}

export function isSymbol(obj) {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
}

export function isBuffer(obj) {
    if(BUNDILIO_TARGET === 'node') {
        return Buffer.isBuffer(obj);
    }
    // TODO: should we check if obj is a UInt8Array or something?
    return false;
}

export function isError(obj) {
    return obj instanceof Error;
}