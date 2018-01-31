export function isString(x) {
    return Object.prototype.toString.call(x) === '[object String]';
}

export function isObject(x) {
    return Object.prototype.toString.call(x) === '[object Object]';
}

export function isFunction(x) {
    return Object.prototype.toString.call(x) === '[object Function]';
}

/**
 * Determines if an object has a key/property.
 * Equivalent to obj.hasOwnProperty(key)
 *
 * @param   {object} obj Object
 * @param   {string} key      Key/property
 *
 * @returns {boolean} True if object has key, false otherwise
 */
export function hasProp(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isNumber(x) {
    return Object.prototype.toString.call(x) === "[object Number]";
}

export function isBoolean(x) {
    return Object.prototype.toString.call(x) === "[object Boolean]";
}

export function isGeneratorFunction(x) {
    return Object.prototype.toString.call(x) === "[object GeneratorFunction]";
}