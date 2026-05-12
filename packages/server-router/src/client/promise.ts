/**
 * A value that may be returned immediately or through a promise.
 *
 * @example
 * ```ts
 * const headers: MaybePromise<HeadersInit> = { authorization: 'Bearer token' }
 * ```
 *
 * @typeParam T - The resolved value type.
 */
export type MaybePromise<T> = T | Promise<T>
