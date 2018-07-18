export function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj) {
    return isObject(obj) && (
        obj.constructor === Object  // obj = {}
        || obj.constructor === undefined // obj = Object.create(null)
    );
}

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

export function isDate(obj) {
    return obj instanceof Date;
}

export function isSet(obj) {
    return obj instanceof Set;
}

export function isMap(obj) {
    return obj instanceof Map;
}

export function isNull(obj) {
    return obj === null;
}

export function isSymbol(obj) {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
}

export function isNullish(obj) { 
    return obj === null || obj === undefined || obj !== obj;
}


export function isUndefined(obj) {
    return obj === undefined;
}

const PRIMITIVES = new Set(['string','number','boolean','symbol']); // https://developer.mozilla.org/en-US/docs/Glossary/Primitive
export function isPrimitive(obj) {
    return obj == null || PRIMITIVES.has(typeof obj);
}