import {isSyncResult, ok, type Err, type Ok, type SyncResult} from '../sync-result.ts'

/**
 * Normalize a value into an `Ok` while preserving existing `SyncResult`s.
 *
 * @example
 * const result = resolve(123) // Ok<number>
 *
 * @example
 * const already = resolve(ok('hi')) // returns the same SyncResult unchanged
 */
export function resolve<V>(result: Ok<V>): Ok<V>;
export function resolve<E>(result: Err<E>): Err<E>;
export function resolve<V, E>(result: SyncResult<V, E>): SyncResult<V, E>;
export function resolve<V>(value: V): Ok<V>;
export function resolve(value: unknown): SyncResult<unknown, unknown> {
    return isSyncResult(value) ? value : ok(value)
}
