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

export function isBoolean(obj) {
    return obj === true || obj === false;
}

export function isRegExp(obj) {
    return obj instanceof RegExp;
}

export function isArray(obj) {
    return Array.isArray(obj);
}

export function isNull(obj) {
    return obj === null;
}

export function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj) {
    return isObject(obj)
        && !isString(obj)
        && !isNumber(obj)
        && !isRegExp(obj)
        && !isArray(obj);
}

export function isSymbol(obj) {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
}
