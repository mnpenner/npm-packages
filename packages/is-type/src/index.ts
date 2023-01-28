export type Falsy = false|0|-0|0n|''|null|undefined|HTMLAllCollection
export type Truthy = Exclude<any,Falsy>
export type Primitive = string|number|bigint|boolean|undefined|symbol|null
export type UnknownFunction = (...args: unknown[]) => unknown


export function isFunction(obj: any): obj is UnknownFunction {
    return typeof obj === 'function'
}

export function isDate(obj: any): obj is Date {
    return obj instanceof Date
}

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

export function isNumber(obj: any): obj is number {
    return typeof obj === 'number'
}

export function isFiniteNumber(obj: any): obj is number {
    return Number.isFinite(obj)
}

export function isInteger(obj: any): obj is number {
    return Number.isInteger(obj)
}

export function isSafeInteger(obj: any): obj is number {
    return Number.isSafeInteger(obj)
}

export function isBitSafeInteger(obj: any): obj is number {
    return typeof obj === 'number' && (obj|0) === obj
}

export function isFloat(obj: any): obj is number {
    return isFiniteNumber(obj) && Math.trunc(obj) !== obj
}

export function isBigInt(obj: any): obj is bigint {
    return typeof obj === 'bigint'
}

export function isSet(obj: any): obj is Set<unknown> {
    return obj instanceof Set
}

export function isMap(obj: any): obj is Map<unknown,unknown> {
    return obj instanceof Map
}

export function isArray(obj: any): obj is Array<unknown> {
    return Array.isArray(obj)
}

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

export function isObjectLike(obj: any): obj is object {
    return typeof obj === 'object' && obj !== null
}

export function isObject(obj: any): obj is (object|UnknownFunction) {
    return obj != null && (typeof obj === 'object' || typeof obj === 'function')
}

export function isPlainObject(obj: any): obj is Record<PropertyKey,unknown> {
    if(obj == null || Object.prototype.toString.call(obj) !== '[object Object]') return false
    const proto = Object.getPrototypeOf(obj)
    return proto === null || proto === Object.prototype
}
export const isPojo = isPlainObject

export function isNull(obj: any): obj is null {
    return obj === null
}

export function isUndefined(obj: any): obj is undefined {
    return obj === void 0
}

export function isNullish(obj: any): obj is null|undefined {
    return obj == null
}


export function isTruthy(obj: any): obj is Truthy {
    return Boolean(obj)
}

export function isFalsy(obj: any): obj is Falsy {
    return !obj
}

export function isSymbol(obj: any): obj is (symbol|Symbol) {
    return typeof obj === 'symbol' || obj instanceof Symbol
}

export function isString(obj: any): obj is string {
    return typeof obj === 'string'
}

export function isStringLike(obj: any): obj is (string|String) {
    return getStringTag(obj) === 'String'
}

export function isNumberLike(obj: any): obj is (number|Number) {
    return getStringTag(obj) === 'Number'
}

export function isBoolean(obj: any): obj is boolean {
    return obj === true || obj === false
}

export function isRegExp(obj: any): obj is RegExp {
    return obj instanceof RegExp
}

export function isError(obj: any): obj is Error {
    return obj instanceof Error
}

// export function isBuffer(obj: any): obj is Buffer {
//     return Buffer.isBuffer(obj)
// }

