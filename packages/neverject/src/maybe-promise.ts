/**
 * A value that may be immediate or wrapped in a `PromiseLike`.
 *
 * @typeParam T - Underlying value type.
 * @example
 * async function double(value: MaybePromise<number>): Promise<number> {
 *     const resolved = await value
 *     return resolved * 2
 * }
 */
export type MaybePromise<T> = T | PromiseLike<T>
