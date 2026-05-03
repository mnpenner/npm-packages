/**
 * Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback,
 * the returned function will return a promise whose fate is decided by the callback behavior
 * of the given node function. The node function should conform to node.js convention of
 * accepting a callback as last argument and calling that callback with error as the first
 * argument and success value on the second argument.
 *
 * @param nodeFunction - The node-style function to promisify.
 * @returns A promisified version of the function.
 */
export function promisify<TResult>(
    nodeFunction: (...args: any[]) => any,
): (...args: any[]) => Promise<TResult> {
    return function (this: any, ...args: any[]) {
        return new Promise((resolve, reject) => {
            nodeFunction.call(this, ...args, (err: Error | undefined, data: TResult) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }
}

/**
 * Represents a fulfilled promise state.
 */
export const FULFILLED = 'fulfilled'
/**
 * Represents a rejected promise state.
 */
export const REJECTED = 'rejected'

/**
 * Result of a settled promise.
 */
export interface PromiseState<T> {
    state: string
    value?: T
    reason?: Error
}

/**
 * Waits for all promises to settle (either fulfill or reject).
 * @param promises - List of promises.
 * @returns Promise resolving to list of results.
 * @deprecated Use [`Promise.allSettled`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled} instead.
 */
export function allSettled<T>(promises: Array<Promise<T> | T>): Promise<PromiseState<T>[]> {
    return Promise.all(
        promises.map((p) =>
            Promise.resolve(p).then(
                (v) => ({
                    state: FULFILLED,
                    value: v,
                }),
                (r) => ({
                    state: REJECTED,
                    reason: r,
                }),
            ),
        ),
    )
}
