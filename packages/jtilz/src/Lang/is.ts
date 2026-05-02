/**
 * Checks if value is a native function.
 * @param obj - The value to check.
 * @returns `true` if value is a native function, `false` otherwise.
 * @example
 * ```ts
 * isNativeFunction(Math.max); // true
 * isNativeFunction(() => {}); // false
 * ```
 */
export function isNativeFunction(obj: any): obj is (...args: any[]) => any {
    return isFunction(obj) && obj.toString().endsWith('{ [native code] }');
}

/**
 * Checks if value is a function.
 * @param obj - The value to check.
 * @returns `true` if value is a function, `false` otherwise.
 * @example
 * ```ts
 * isFunction(() => {}); // true
 * isFunction(1); // false
 * ```
 */
export function isFunction(obj: any): obj is (...args: any[]) => any {
    return typeof obj === 'function';
}

/**
 * Checks if value is iterable.
 * @param obj - The value to check.
 * @returns `true` if value is iterable, `false` otherwise.
 * @example
 * ```ts
 * isIterable([]); // true
 * isIterable('abc'); // true
 * isIterable({}); // false
 * ```
 */
export function isIterable(obj: any): obj is Iterable<any> {
    return obj && isFunction(obj[Symbol.iterator]);
}

/**
 * Checks if value is a string.
 * @param obj - The value to check.
 * @returns `true` if value is a string, `false` otherwise.
 */
export function isString(obj: any): obj is string {
    return typeof obj === 'string' || obj instanceof String;
}

/**
 * Checks if value is a number.
 * @param obj - The value to check.
 * @returns `true` if value is a number, `false` otherwise.
 */
export function isNumber(obj: any): obj is number {
    return typeof obj === 'number' || obj instanceof Number;
}

/**
 * Checks if value is an integer.
 * @param obj - The value to check.
 * @returns `true` if value is an integer, `false` otherwise.
 */
export function isInteger(obj: any): obj is number {
    return isNumber(obj) && obj === (obj|0);
}

/**
 * Checks if value is a number with a non-zero fractional part.
 * 
 * Note: `1.000` is considered an integer, not a float. Similarly, `999999.00000000001` is an integer, but `5e-324` is a float (see Number.MIN_VALUE).
 * @param obj - The value to check.
 * @returns `true` if value is a float, `false` otherwise.
 */
export function isFloat(obj: any): obj is number {
    return isNumber(obj) && obj !== (obj|0);
}

/**
 * Checks if value is a promise.
 * @param obj - The value to check.
 * @returns `true` if value is a promise, `false` otherwise.
 */
export function isPromise(obj: any): obj is Promise<any> {
    return obj instanceof Promise;
}

/**
 * Checks if value is a boolean.
 * @param obj - The value to check.
 * @returns `true` if value is a boolean, `false` otherwise.
 */
export function isBoolean(obj: any): obj is boolean {
    return obj === true || obj === false; // there's also a `Boolean` type but it doesn't behave much like a boolean
}

/**
 * Checks if value is a RegExp.
 * @param obj - The value to check.
 * @returns `true` if value is a RegExp, `false` otherwise.
 */
export function isRegExp(obj: any): obj is RegExp {
    return obj instanceof RegExp;
}

/**
 * Checks if value is a Date.
 * @param obj - The value to check.
 * @returns `true` if value is a Date, `false` otherwise.
 */
export function isDate(obj: any): obj is Date {
    return obj instanceof Date;
}

/**
 * Checks if value is a Set.
 * @param obj - The value to check.
 * @returns `true` if value is a Set, `false` otherwise.
 */
export function isSet(obj: any): obj is Set<any> {
    return obj instanceof Set;
}

/**
 * Checks if value is a Map.
 * @param obj - The value to check.
 * @returns `true` if value is a Map, `false` otherwise.
 */
export function isMap(obj: any): obj is Map<any,any> {
    return obj instanceof Map;
}

/**
 * Checks if value is a WeakMap.
 * @param obj - The value to check.
 * @returns `true` if value is a WeakMap, `false` otherwise.
 */
export function isWeakMap(obj: any): obj is WeakMap<any, any> {
    return obj instanceof WeakMap;
}

/**
 * Checks if value is an array.
 * @param obj - The value to check.
 * @returns `true` if value is an array, `false` otherwise.
 */
export function isArray(obj: any): obj is Array<any> {
    return Array.isArray(obj);
}

/**
 * Checks if value is null.
 * @param obj - The value to check.
 * @returns `true` if value is null, `false` otherwise.
 */
export function isNull(obj: any): obj is null {
    return obj === null;
}

/**
 * Checks if value is undefined.
 * @param obj - The value to check.
 * @returns `true` if value is undefined, `false` otherwise.
 */
export function isUndefined(obj: any): obj is undefined {
    return obj === undefined;
}

/**
 * Checks if value is `null`, `undefined` or `NaN`
 * @param obj - The value to check.
 * @returns `true` if value is nullish, `false` otherwise.
 */
export function isNullish(obj: any): obj is null|undefined|number { // the NaN kind of screws up the type checking...
    return obj === null || obj === undefined || obj !== obj;
}

/**
 * Checks if value is `null` or `undefined`.
 * @param obj - The value to check.
 * @returns `true` if value is nil, `false` otherwise.
 */
export function isNil(obj: any): obj is null|undefined {
    return obj === null || obj === undefined;
}

/**
 * Checks if value is an object.
 * @param obj - The value to check.
 * @returns `true` if value is an object, `false` otherwise.
 */
export function isObject(obj: any): obj is object {
    return obj != null && typeof obj === 'object';
}

/**
 * Checks if value is `NaN`, like `Number.isNaN` but unlike `global.isNaN`.
 * @param obj - The value to check.
 * @returns `true` if value is NaN, `false` otherwise.
 */
export function isNaN(obj: any): obj is number {
    return obj !== obj;
}

/**
 * Checks if value is a plain object.
 * @param obj - The value to check.
 * @returns `true` if value is a plain object, `false` otherwise.
 */
export function isPlainObject(obj: any): obj is object {
    // https://stackoverflow.com/a/23441431/65387
    // return Object.prototype.toString.call(obj) === '[object Object]';
    if(!isObject(obj)) return false;
    const proto = Object.getPrototypeOf(obj);
    return proto === null || proto === Object.prototype;
}

/**
 * Checks if value is a symbol.
 * @param obj - The value to check.
 * @returns `true` if value is a symbol, `false` otherwise.
 */
export function isSymbol(obj: any): obj is symbol {
    return Object.prototype.toString.call(obj) === '[object Symbol]';
}

/**
 * Checks if value is an Error.
 * @param obj - The value to check.
 * @returns `true` if value is an Error, `false` otherwise.
 */
export function isError(obj: any): obj is Error {
    return obj instanceof Error;
}