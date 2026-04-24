import {err, type Err, type Result, type Ok} from '../result.ts'
import {toDetailedError, type DetailedError} from '../detailed-error.ts'
import {isResult} from './type-check.ts'

/**
 * Return an existing successful [`Ok`]{@link Ok} result untouched when normalizing with [`rejectWithError`]{@link rejectWithError}.
 *
 * @typeParam V - Value payload type.
 * @param result - The successful [`Ok`]{@link Ok} to pass through.
 * @returns The same [`Ok`]{@link Ok} instance.
 * @example
 * const success = ok(1)
 * const normalized = rejectWithError(success)
 * console.assert(normalized === success)
 */
export function rejectWithError<V>(result: Ok<V>): Ok<V>;

/**
 * Return an existing failed [`Err`]{@link Err} result untouched when normalizing with [`rejectWithError`]{@link rejectWithError}.
 *
 * @typeParam E - Error payload type.
 * @param result - The failed [`Err`]{@link Err} to pass through.
 * @returns The same [`Err`]{@link Err} instance.
 * @example
 * const failure = err('boom')
 * const normalized = rejectWithError(failure)
 * console.assert(normalized === failure)
 */
export function rejectWithError<E>(result: Err<E>): Err<E>;

/**
 * Preserve a [`Result`]{@link Result} as-is when calling [`rejectWithError`]{@link rejectWithError}.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @param result - The [`Result`]{@link Result} to return unchanged.
 * @returns The same [`Result`]{@link Result}.
 * @example
 * const maybe = Math.random() > 0.5 ? ok(2) : err('x')
 * const normalized = rejectWithError(maybe)
 * console.assert(normalized === maybe)
 */
export function rejectWithError<V, E>(result: Result<V, E>): Result<V, E>;

/**
 * Convert an `Error` instance into [`Err`]{@link Err} without wrapping it in [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam E - Error instance type.
 * @param reason - An `Error` to wrap.
 * @returns An [`Err`]{@link Err} containing the provided `Error`.
 * @example
 * const failure = rejectWithError(new Error('boom'))
 * console.assert(!failure.ok && failure.error.message === 'boom')
 */
export function rejectWithError<E extends Error>(reason: E): Err<E>;

/**
 * Convert any rejection reason into [`Err<DetailedError>`]{@link DetailedError}, enriching non-error values.
 *
 * @typeParam T - Raw rejection reason type.
 * @param reason - Any value representing a failure.
 * @returns An [`Err`]{@link Err} containing a [`DetailedError`]{@link DetailedError}.
 * @example
 * const failure = rejectWithError('oops')
 * console.assert(!failure.ok && failure.error.details === 'oops')
 */
export function rejectWithError<T>(reason: T): Err<DetailedError<T>>;
export function rejectWithError(reason: unknown): Result<unknown, unknown> {
    return isResult(reason) ? reason : err(toDetailedError(reason))
}

/**
 * Return an existing successful [`Ok`]{@link Ok} result untouched when normalizing with [`reject`]{@link reject}.
 *
 * @typeParam V - Value payload type.
 * @param result - The successful [`Ok`]{@link Ok} to pass through.
 * @returns The same [`Ok`]{@link Ok} instance.
 * @example
 * const success = ok(1)
 * const normalized = reject(success)
 * console.assert(normalized === success)
 */
export function reject<V>(result: Ok<V>): Ok<V>;

/**
 * Return an existing failed [`Err`]{@link Err} result untouched when normalizing with [`reject`]{@link reject}.
 *
 * @typeParam E - Error payload type.
 * @param result - The failed [`Err`]{@link Err} to pass through.
 * @returns The same [`Err`]{@link Err} instance.
 * @example
 * const failure = err('boom')
 * const normalized = reject(failure)
 * console.assert(normalized === failure)
 */
export function reject<E>(result: Err<E>): Err<E>;

/**
 * Preserve any [`Result`]{@link Result} when normalizing with [`reject`]{@link reject}.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @param result - A [`Result`]{@link Result} to return unchanged.
 * @returns The same [`Result`]{@link Result}.
 * @example
 * const maybe = Math.random() > 0.5 ? ok(2) : err('x')
 * const normalized = reject(maybe)
 * console.assert(normalized === maybe)
 */
export function reject<V, E>(result: Result<V, E>): Result<V, E>;

/**
 * Wrap any reason in an [`Err`]{@link Err} without converting it to [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam E - Error payload type.
 * @param reason - Any failure payload.
 * @returns An [`Err`]{@link Err} with the provided reason.
 * @example
 * const failure = reject('plain failure')
 * console.assert(!failure.ok && failure.error === 'plain failure')
 */
export function reject<E>(reason: E): Err<E>;
export function reject(reason: unknown): Result<unknown, unknown> {
    return isResult(reason) ? reason : err(reason)
}
