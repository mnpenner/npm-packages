export type Falsy = false|0|-0|0n|''|null|undefined|HTMLAllCollection
export type Truthy = Exclude<any,Falsy>
export type Primitive = string|number|bigint|boolean|undefined|symbol|null
export type UnknownFunction = (...args: unknown[]) => unknown
export type UnknownGeneratorFunction = (...args: unknown[]) => Generator<unknown, unknown, unknown>

/**
 * Object is callable.
 */
export function isFunction(obj: any): obj is UnknownFunction {
    return typeof obj === 'function'
}

/**
 * Object is callable.
 */
export function isGeneratorFunction(obj: any): obj is UnknownGeneratorFunction {
    return isFunction(obj) && Object.prototype.toString.call(obj) === "[object GeneratorFunction]";
}

/**
 * Object is a Date, possibly invalid.
 */
export function isDate(obj: any): obj is Date {
    return obj instanceof Date
}

/**
 * Object is a Date other than `Invalid Date`.
 */
export function isValidDate(obj: any): obj is Date {
    return isDate(obj) && !Number.isNaN(obj.valueOf())
}

/**
 * Object can be used in a for-of loop.
 * N.B. Plain objects can be used in for-in but not for-of, so this function will return false for them.
 */
export function isIterable(obj: any): obj is Iterable<unknown> {
    return isObjectLike(obj) && isFunction((obj as any)[Symbol.iterator])
}

/**
 * Object is a number, possibly Infinity or NaN.
 */
export function isNumber(obj: any): obj is number {
    return typeof obj === 'number'
}

/**
 * Object is a number other than Infinity, -Infinity and NaN.
 */
export function isFiniteNumber(obj: any): obj is number {
    return Number.isFinite(obj)
}

/**
 * Object is an integer number.
 */
export function isInteger(obj: any): obj is number {
    return Number.isInteger(obj)
}

/**
 * Object is a number between `-9007199254740991` and `9007199254740991`
 */
export function isSafeInteger(obj: any): obj is number {
    return Number.isSafeInteger(obj)
}

/**
 * Object is a 32-bit integer (safe for bitwise operations).
 */
export function isBitSafeInteger(obj: any): obj is number {
    return typeof obj === 'number' && (obj|0) === obj
}

/**
 * Object is a number with fractional component.
 */
export function isFloat(obj: any): obj is number {
    return isFiniteNumber(obj) && Math.trunc(obj) !== obj
}

/**
 * Object is a BigInt.
 */
export function isBigInt(obj: any): obj is bigint {
    return typeof obj === 'bigint'
}

/**
 * Object is a Set.
 */
export function isSet(obj: any): obj is Set<unknown> {
    return obj instanceof Set
}

/**
 * Object is a Map.
 */
export function isMap(obj: any): obj is Map<unknown,unknown> {
    return obj instanceof Map
}

/**
 * Object is an Array.
 */
export function isArray(obj: any): obj is Array<unknown> {
    return Array.isArray(obj)
}

/**
 * Object is a [Primitive](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
 */
export function isPrimitive(obj: any): obj is Primitive {
    return obj == null || isString(obj) || isNumber(obj) || isBigInt(obj) || isBoolean(obj) || isSymbol(obj)
}

function getStringTag(value: any): string {
    // https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/.internal/getTag.js
    if (value == null) {
        return value === undefined ? 'Undefined' : 'Null'
    }
    return  Object.prototype.toString.call(value).slice(8, -1)
}

/**
 * Value is a non-null and non-function object.
 */
export function isObjectLike(obj: any): obj is object {
    return typeof obj === 'object' && obj !== null
}

/**
 * Value is an object or function (which also act like objects).
 */
export function isObject(obj: any): obj is (object|UnknownFunction) {
    return obj != null && (typeof obj === 'object' || typeof obj === 'function')
}

/**
 * Value is a plain object, created using typical `{object: "notation"}` or an object with no prototype (`{__proto__:null}` or `Object.create(null)`). Functions, Dates, Maps, Sets, Errors, RegExps, arrays and libraries like Math are *not* considered plain, nor are objects that have tampered with `[Symbol.toStringTag]`.
 */
export function isPlainObject(obj: any): obj is Record<PropertyKey,unknown> {
    if(obj == null || Object.prototype.toString.call(obj) !== '[object Object]') return false
    const proto = Object.getPrototypeOf(obj)
    return proto === null || proto === Object.prototype
}

/**
 * Alias of {@link isPlainObject}. Stands for "is plain old JavaScript object".
 */
export const isPojo = isPlainObject

/**
 * Object is `null`.
 */
export function isNull(obj: any): obj is null {
    return obj === null
}

/**
 * Object is `undefined`.
 */
export function isUndefined(obj: any): obj is undefined {
    return obj === void 0
}

/**
 * Object is `null` or `undefined`.
 */
export function isNullish(obj: any): obj is null|undefined {
    return obj == null
}

/**
 * Object is treated as `true` when used in a conditional.
 */
export function isTruthy(obj: any): obj is Truthy {
    return Boolean(obj)
}

/**
 * Object is treated as `false` when used in a conditional.
 */
export function isFalsy(obj: any): obj is Falsy {
    return !obj
}

/**
 * Object is a symbol.
 */
export function isSymbol(obj: any): obj is (symbol|Symbol) {
    return typeof obj === 'symbol' || obj instanceof Symbol
}

/**
 * Object is a string. Excludes `new String` syntax.
 */
export function isString(obj: any): obj is string {
    return typeof obj === 'string'
}

/**
 * Object is a string or String.
 */
export function isStringLike(obj: any): obj is (string|String) {
    return getStringTag(obj) === 'String'
}

/**
 * Object is a number or Number.
 */
export function isNumberLike(obj: any): obj is (number|Number) {
    return getStringTag(obj) === 'Number'
}

/**
 * Object is a boolean or Boolean.
 */
export function isBooleanLike(obj: any): obj is (boolean|Boolean) {
    return getStringTag(obj) === 'Boolean'
}

/**
 * Object is `true` or `false`.
 */
export function isBoolean(obj: any): obj is boolean {
    return obj === true || obj === false
}

/**
 * Object is a RegExp created like `/re/` or `new RegExp`.
 */
export function isRegExp(obj: any): obj is RegExp {
    return obj instanceof RegExp
}

/**
 * Object is an Error.
 */
export function isError(obj: any): obj is Error {
    return obj instanceof Error
}

// export function isBuffer(obj: any): obj is Buffer {
//     return Buffer.isBuffer(obj)
// }

