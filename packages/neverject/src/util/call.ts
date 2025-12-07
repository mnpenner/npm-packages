import {type Err, type Ok, type Result} from '../result.ts'
import {type DetailedError} from '../detailed-error.ts'
import {rejectWithError} from './reject.ts'
import {resolve} from './resolve.ts'
import {nj} from '../nj.ts'
import {type NeverjectPromise} from '../neverject-promise.ts'
import type {MaybePromise} from '../maybe-promise.ts'

/**
 * Invoke a sync function that never returns successfully, capturing thrown errors as `Err`.
 *
 * @typeParam A - Argument tuple type.
 * @param fn - Function that is expected to throw.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`Result`]{@link Result} containing the thrown error.
 * @example
 * const errResult = tryCall(() => { throw 'boom' })
 * console.assert(!errResult.ok)
 */
export function tryCall<A extends any[] = []>(fn: (...args: A) => never, ...args: A): Result<never, unknown>;

/**
 * Invoke a sync function that returns [`Ok`]{@link Ok}, forwarding the successful payload.
 *
 * @typeParam V - Value payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning [`Ok`]{@link Ok}.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`Result`]{@link Result} containing the same success.
 * @example
 * const okResult = tryCall(() => ok(1))
 * console.assert(okResult.ok && okResult.value === 1)
 */
export function tryCall<V, A extends any[] = []>(fn: (...args: A) => Ok<V>, ...args: A): Result<V, never>;

/**
 * Invoke a sync function that returns [`Err`]{@link Err}, forwarding the error payload.
 *
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning [`Err`]{@link Err}.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`Result`]{@link Result} containing the same error.
 * @example
 * const errResult = tryCall(() => err('nope'))
 * console.assert(!errResult.ok && errResult.error === 'nope')
 */
export function tryCall<E, A extends any[] = []>(fn: (...args: A) => Err<E>, ...args: A): Result<never, E>;

/**
 * Invoke a sync function that returns a [`Result`]{@link Result}, preserving its shape.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning [`Result`]{@link Result}.
 * @param args - Arguments forwarded to `fn`.
 * @returns The same [`Result`]{@link Result} shape produced by `fn`.
 * @example
 * const maybe = tryCall((a: number, b: number) => b ? ok(a / b) : err('div by 0'), 6, 2)
 * console.assert(maybe.ok && maybe.value === 3)
 */
export function tryCall<V, E, A extends any[] = []>(fn: (...args: A) => Result<V, E>, ...args: A): Result<V, E>;

/**
 * Invoke a sync function returning a plain value, capturing thrown errors as [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam V - Value payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning a raw value.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`Result`]{@link Result} with `Ok<V>` on success or `Err<DetailedError>` on thrown error.
 * @example
 * const safeValue = tryCall((x: number) => x * 2, 2)
 * console.assert(safeValue.ok && safeValue.value === 4)
 */
export function tryCall<V, A extends any[] = []>(fn: (...args: A) => V, ...args: A): Result<V, DetailedError<unknown>>;

/**
 * Invoke a sync function that may return either a plain value or a [`Result`]{@link Result}, normalizing the output and capturing thrown errors.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning `V` or [`Result`]{@link Result}.
 * @param args - Arguments forwarded to `fn`.
 * @returns A normalized [`Result`]{@link Result}.
 * @example
 * const maybe = tryCall((flag: boolean) => flag ? 1 : err('bad'), true)
 * console.assert(maybe.ok && maybe.value === 1)
 */
export function tryCall<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Result<V, E> | V, ...args: A): Result<V, E | DetailedError<unknown>> {
    try {
        return resolve(fn(...args)) as Result<V, E>
    } catch(e) {
        return rejectWithError(e) as Result<V, E | DetailedError<unknown>>
    }
}

/**
 * Invoke an async function that never fulfills successfully, capturing thrown errors and promise rejections as `Err`.
 *
 * @typeParam A - Argument tuple type.
 * @param fn - Async function expected to reject.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} containing the error payload.
 * @example
 * const failed = await tryCallAsync(() => Promise.reject('boom'))
 * console.assert(!failed.ok)
 */
export function tryCallAsync<A extends any[] = []>(fn: (...args: A) => MaybePromise<never>, ...args: A): NeverjectPromise<never, DetailedError<unknown>>;

/**
 * Invoke an async function that returns [`Ok`]{@link Ok}, forwarding the successful payload.
 *
 * @typeParam V - Value payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning [`Ok`]{@link Ok}.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} resolving to `Ok<V>`.
 * @example
 * const settled = await tryCallAsync(async () => ok({ id: 1 }))
 * console.assert(settled.ok && settled.value.id === 1)
 */
export function tryCallAsync<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<Ok<V>>, ...args: A): NeverjectPromise<V, never>;

/**
 * Invoke an async function that returns [`Err`]{@link Err}, forwarding the error payload.
 *
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning [`Err`]{@link Err}.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} resolving to `Err<E>`.
 * @example
 * const settled = await tryCallAsync(async () => err('nope'))
 * console.assert(!settled.ok && settled.error === 'nope')
 */
export function tryCallAsync<E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Err<E>>, ...args: A): NeverjectPromise<never, E>;

/**
 * Invoke an async function that returns a [`Result`]{@link Result}, preserving its shape.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning [`Result`]{@link Result}.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that mirrors the result.
 * @example
 * const settled = await tryCallAsync(async (id: number) => id ? ok(id) : err('missing'), 2)
 * console.assert(settled.ok && settled.value === 2)
 */
export function tryCallAsync<V, E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E>>, ...args: A): NeverjectPromise<V, E>;

/**
 * Invoke an async function returning a plain value, capturing thrown errors and rejections as [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam V - Value payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning a raw value.
 * @param args - Arguments forwarded to `fn`.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} with `Ok<V>` on success or `Err<DetailedError>` on failure.
 * @example
 * const settled = await tryCallAsync(async (x: number) => x * 2, 3)
 * console.assert(settled.ok && settled.value === 6)
 */
export function tryCallAsync<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<V>, ...args: A): NeverjectPromise<V, DetailedError<unknown>>;

/**
 * Invoke an async function that may return a plain value or a [`Result`]{@link Result}, normalizing both into [`NeverjectPromise`]{@link NeverjectPromise}.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning `V` or [`Result`]{@link Result}.
 * @param args - Arguments forwarded to `fn`.
 * @returns A normalized [`NeverjectPromise`]{@link NeverjectPromise}.
 * @example
 * const settled = await tryCallAsync(async (flag: boolean) => flag ? 1 : err('no'), false)
 * console.assert(!settled.ok && settled.error === 'no')
 */
export function tryCallAsync<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E> | V>, ...args: A): NeverjectPromise<V, E | DetailedError<unknown>> {
    const promisedResult = Promise.try(fn, ...args) as PromiseLike<Result<V, E> | V>
    return nj(promisedResult) as NeverjectPromise<V, E | DetailedError<unknown>>
}
