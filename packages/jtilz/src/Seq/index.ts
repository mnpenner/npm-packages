// https://github.com/Microsoft/TypeScript/issues/1024#issuecomment-68059662
// https://github.com/Microsoft/TypeScript/issues/5453

/**
 * Wraps a function to allow chaining.
 * @param fn - The function to wrap.
 * @returns The wrapped function.
 */
export default function chain(fn: (...args: any[]) => any) {
    return function chainWrap(this: any, ...args: any[]) {
        return fn.call(this, this, ...args)
    }
}

/**
 * Passes the value to a callback and returns the result.
 * @param callback - The callback function.
 * @returns The result of the callback.
 */
export function thru(this: any, callback: (...args: any[]) => any) {
    return callback(this)
}

/**
 * Passes the value to a callback and returns the value.
 * @param callback - The callback function.
 * @returns The value.
 */
export function tap(this: any, callback: (...args: any[]) => any) {
    callback(this)
    return this
}
