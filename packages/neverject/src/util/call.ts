import {isSyncResult, ok, type Err, type Ok, type SyncResult} from '../sync-result.ts'
import {type DetailedError} from '../detailed-error.ts'
import {rejectWithError} from './reject.ts'

/**
 * Invoke a sync function and normalize its return into a `SyncResult`, capturing thrown errors as `Err<DetailedError>`.
 *
 * @example
 * const okResult = call(() => 1) // Ok<number>
 *
 * @example
 * const errResult = call(() => { throw 'boom' }) // Err<DetailedError<string>>
 */
export function call<A extends any[] = []>(fn: (...args: A) => never, ...args: A): SyncResult<unknown, unknown>;
export function call<V, A extends any[] = []>(fn: (...args: A) => Ok<V>, ...args: A): SyncResult<V, never>;
export function call<E, A extends any[] = []>(fn: (...args: A) => Err<E>, ...args: A): SyncResult<never, E>;
export function call<V, E, A extends any[] = []>(fn: (...args: A) => SyncResult<V,E>, ...args: A): SyncResult<V, E>;
export function call<V, A extends any[] = []>(fn: (...args: A) => V, ...args: A): SyncResult<V, DetailedError<unknown>>;
export function call<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => SyncResult<V, E> | V, ...args: A): SyncResult<V, E | DetailedError<unknown>> {
    try{
        const result = fn(...args)
        return isSyncResult(result) ? result : ok(result) as SyncResult<V, E>
    } catch(e) {
        return rejectWithError(e) as SyncResult<V, E | DetailedError<unknown>>
    }
}
