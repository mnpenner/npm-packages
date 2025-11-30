import {err, isSyncResult, type Err, type SyncResult, type Ok} from '../sync-result.ts'
import {toDetailedError, type DetailedError} from '../detailed-error.ts'

/**
 * Normalize an error-like input into an `Err` while preserving existing `SyncResult`s.
 *
 * @example
 * const result = reject('boom')  // Err<DetailedError<string>>
 *
 * @example
 * const already = reject(err('x'))  // returns the same SyncResult unchanged
 */
export function reject<V>(result: Ok<V>): Ok<V>;
export function reject<E>(result: Err<E>): Err<E>;
export function reject<V, E>(result: SyncResult<V, E>): SyncResult<V, E>;
export function reject<E extends Error>(reason: E): Err<E>;
export function reject<T>(reason: T): Err<DetailedError<T>>;
export function reject(reason: unknown): SyncResult<unknown, unknown> {
    return isSyncResult(reason) ? reason : err(toDetailedError(reason))
}
