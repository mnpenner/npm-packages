import {ok, type Err, type Ok, type Result} from '../result.ts'
import {isResult} from './type-check.ts'

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
export function resolve<V, E>(result: Result<V, E>): Result<V, E>;
export function resolve<V>(value: V): Ok<V>;
export function resolve<V, E>(value: Result<V, E> | V): Result<V, E> {
    return isResult(value) ? value : ok(value)
}
