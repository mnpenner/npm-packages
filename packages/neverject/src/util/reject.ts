import {err, isSyncResult, type Err, type SyncResult, type Ok} from '../sync-result.ts'
import {toDetailedError, type DetailedError} from '../detailed-error.ts'

/**
 * Normalize an error-like input into an `Err` while preserving existing `SyncResult`s, converting unknown reasons to `DetailedError`.
 *
 * @example
 * const result = rejectWithError('boom')  // Err<DetailedError<string>>
 *
 * @example
 * const already = rejectWithError(err('x'))  // returns the same SyncResult unchanged
 */
export function rejectWithError<V>(result: Ok<V>): Ok<V>;
export function rejectWithError<E>(result: Err<E>): Err<E>;
export function rejectWithError<V, E>(result: SyncResult<V, E>): SyncResult<V, E>;
export function rejectWithError<E extends Error>(reason: E): Err<E>;
export function rejectWithError<T>(reason: T): Err<DetailedError<T>>;
export function rejectWithError(reason: unknown): SyncResult<unknown, unknown> {
    return isSyncResult(reason) ? reason : err(toDetailedError(reason))
}

/**
 * Normalize an error-like input into an `Err` while preserving existing `SyncResult`s, leaving reasons untouched.
 *
 * @example
 * const result = reject('boom')  // Err<string>
 *
 * @example
 * const already = reject(err('x'))  // returns the same SyncResult unchanged
 */
export function reject<V>(result: Ok<V>): Ok<V>;
export function reject<E>(result: Err<E>): Err<E>;
export function reject<V, E>(result: SyncResult<V, E>): SyncResult<V, E>;
export function reject<E>(reason: E): Err<E>;
export function reject(reason: unknown): SyncResult<unknown, unknown> {
    return isSyncResult(reason) ? reason : err(reason)
}
