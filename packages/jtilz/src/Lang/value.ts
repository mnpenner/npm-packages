import * as Type from '@mpen/is-type'

/**
 * Identity function. Returns whatever it's given as-is.

 * @param arg - The value to return.
 * @returns The same value.
 */
export function identity<T>(arg: T): T {
    return arg
}

/**
 * Unwraps a value. If passed a function, evaluates that function with the
 * provided args. Otherwise, returns the value as-is.
 * @param this - The context to use if calling a function.
 * @param functionOrValue - The function or value to unwrap.
 * @param args - Arguments to pass to the function if applicable.
 * @returns The unwrapped value.
 */
export function value<T>(
    this: any,
    functionOrValue: ((...args: any[]) => T) | T,
    ...args: any[]
): T {
    return Type.isFunction(functionOrValue) ? functionOrValue.call(this, ...args) : functionOrValue
}

/**
 * No operation. Does nothing.
 */
export function noop() {}

/**
 * An immutable empty array.
 */
export const EMPTY_ARRAY = Object.freeze([])

/**
 * An immutable empty object.
 */
export const EMPTY_OBJECT = Object.freeze(Object.create(null))

/**
 * Returns a new object without a prototype from an array of entries.
 * @param entries - Optional array of [key, value] pairs.
 * @returns A new object.
 */
export function obj<T>(entries?: [T, PropertyKey][]) {
    const o = Object.create(null)
    if (!entries?.length) {
        return o
    }
    for (const [k, v] of entries) {
        o[k] = v
    }
    return o
}

/**
 * Returns `true` for:
 * - null
 * - undefined
 * - NaN
 * - Plain objects without any own enumerable properties
 * - Empty arrays, Sets and Maps
 * - Invalid Dates
 * Returns `false` for everything else.
 * @param value - The value to check.
 * @returns True if empty.
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined || value !== value) {
        return true
    }
    if (Type.isArray(value) || Type.isString(value)) {
        return value.length === 0
    }
    if (Type.isPlainObject(value)) {
        return Object.keys(value).length === 0
    }
    if (Type.isMap(value) || Type.isSet(value)) {
        return value.size === 0
    }
    if (Type.isDate(value)) {
        return Type.isNaN(value.valueOf())
    }
    return false
}

/**
 * Creates a shallow clone of the value.
 * @param value - The value to clone.
 * @returns A clone of the value.
 */
export function shallowClone<T>(value: T): T {
    if (Type.isArray(value)) {
        return [...value] as unknown as T
    }
    if (Type.isDate(value)) {
        return Object.assign(new Date(value.valueOf()), value) as unknown as T
    }
    if (Type.isMap(value) || Type.isSet(value)) {
        return Object.assign(new (value.constructor as any)(value), value) as unknown as T
    }
    if (
        Type.isNumber(value) ||
        Type.isString(value) ||
        Type.isNil(value) ||
        Type.isBoolean(value) ||
        Type.isSymbol(value) ||
        Type.isBigInt(value)
    ) {
        return value // these types are immutable. no clone necessary
    }

    if (Type.isRegExp(value)) {
        return Object.assign(new RegExp(value.source, value.flags), value) as unknown as T
    }
    if (Type.isObject(value)) {
        return Object.assign(Object.create(Object.getPrototypeOf(value)), value) as unknown as T
    }
    if (Type.isFunction(value)) {
        if (Type.isNativeFunction(value)) {
            throw new Error(`Cannot clone native functions`)
        }
        const fn = new Function(`return ${(value as any).toString()}`)()
        Object.assign(fn, value)
        return fn as unknown as T
    }

    throw new Error(`Could not clone value`)
}

/**
 * Creates a shallow clone of the value.
 * @param value - The value to clone.
 * @returns A clone of the value.
 * @deprecated Use {@link shallowClone} instead.
 */
export const clone = shallowClone
