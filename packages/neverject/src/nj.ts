import { NeverjectPromise, _INTERNAL_CTOR} from './neverject-promise.ts'
import type {Err, Ok} from './result.ts';
import { err, ok, type Result} from './result.ts'
import {toDetailedError, type DetailedError} from './detailed-error.ts'
import {reject, rejectWithError, resolve} from './util'
import {isResult} from './util/type-check.ts'

/**
 * Normalize a Promise into a {@link NeverjectPromise}.
 *
 * This overload handles standard Promises. If the promise resolves to a `Result`, it is automatically unwrapped (flattened).
 * If the promise rejects, the error is captured as a `DetailedError`.
 *
 * @typeParam P - The type of the Promise.
 * @param value - A Promise-like object to normalize.
 * @returns A {@link NeverjectPromise} that resolves to an `Ok` on success or an `Err` containing a {@link DetailedError} on failure.
 * @example
 * const result = await nj(fetchUser(1))
 * if (result.ok) renderUser(result.value)
 */
export function nj<P>(value: PromiseLike<P>): NeverjectPromise<
    Awaited<P> extends Result<infer V, any> ? V : Awaited<P>,
    Awaited<P> extends Result<any, infer E> ? E : DetailedError<unknown>
>;

/**
 * Wrap an explicit `Error` object into a failed {@link NeverjectPromise}.
 *
 * @param error - The error instance to wrap.
 * @returns A {@link NeverjectPromise} resolving to an `Err` containing the provided error.
 */
export function nj<E extends Error>(error: E): NeverjectPromise<never, E>;

/**
 * Lift an existing `Ok` result into a {@link NeverjectPromise}.
 * @param result - The successful Result object.
 */
export function nj<V>(result: Ok<V>): NeverjectPromise<V, never>;

/**
 * Lift an existing `Err` result into a {@link NeverjectPromise}.
 * @param result - The failed Result object.
 */
export function nj<E>(result: Err<E>): NeverjectPromise<never, E>;

/**
 * Lift an existing generic `Result` into a {@link NeverjectPromise}.
 * @param result - The Result object (Ok or Err).
 */
export function nj<V,E>(result: Result<V,E>): NeverjectPromise<V,E>;

/**
 * Wrap a plain value into a successful {@link NeverjectPromise}.
 *
 * @param value - A plain value.
 * @returns A {@link NeverjectPromise} resolving to an `Ok` containing the value.
 */
export function nj<V>(value: V): NeverjectPromise<V,never>;

/**
 * Normalize a Promise into a {@link NeverjectPromise} using a custom error mapper.
 *
 * @param promise - A Promise-like object.
 * @param errorFn - A function that maps the rejection reason to a specific error type `E`.
 * @returns A {@link NeverjectPromise} resolving to `Ok<P>` or `Err<E>`.
 * @example
 * const mapped = await nj(
 *   Promise.reject('boom'),
 *   (reason) => new Error(String(reason))
 * )
 */
export function nj<P,E>(promise: PromiseLike<P>, errorFn: (e:unknown)=>E): NeverjectPromise<Awaited<P>, E>;

/**
 * Lift a `Result` into a {@link NeverjectPromise} and map the error if present.
 *
 * @param result - The Result object.
 * @param errorFn - A function that maps the existing error `I` to a new error type `E`.
 */
export function nj<V, I, E>(result: Result<V, I>, errorFn: (e: I) => E): NeverjectPromise<V, E>;

/**
 * Wrap a plain value with an error mapper attached (used if the value is a Thenable that rejects).
 *
 * @param value - A plain value.
 * @param errorFn - A function to map errors if `value` acts as a rejected promise.
 */
export function nj<V,E>(value: V, errorFn: (e:unknown)=>E): NeverjectPromise<V, E>;

export function nj(value: unknown, errorFn?: (e: unknown) => unknown): NeverjectPromise<any, any> {
    if(isResult(value)) {
        if(errorFn && !value.ok) {
            return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(err(errorFn(value.error))))
        }
        return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(value))
    }

    if(value instanceof Error) {
        return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(err(value)))
    }

    return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(value).then(
            (value) => resolve(value),
            (reason) => {
                if (errorFn) {
                    return reject(errorFn(reason))
                }
                return rejectWithError(reason)
            }
        )
    )
}
