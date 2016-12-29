function isNativeFunction(obj) {
    return isFunction(obj) && obj.toString().endsWith('{ [native code] }');
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
}

function isNumber(obj) {
    return typeof obj === 'number' || obj instanceof Number;
}

function isRegExp(obj) {
    return obj instanceof RegExp;
}

function isArray(obj) {
    return Array.isArray(obj);
}

function isNull(obj) {
    return obj === null;
}

function isObject(value) {
    return value !== null && typeof value === 'object';
}

module.exports = {isNativeFunction, isFunction, isObject, isNull, isString, isArray, isNumber, isRegExp};