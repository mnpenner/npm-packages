import {type SyncResult} from '../sync-result.ts'
import {type DetailedError} from '../detailed-error.ts'
import {rejectWithError} from './reject.ts'
import {resolve} from './resolve.ts'

/**
 * Invoke a sync function and normalize its return into a `SyncResult`, capturing thrown errors as `Err<DetailedError>`.
 *
 * @example
 * const okResult = call(() => 1) // Ok<number>
 *
 * @example
 * const errResult = call(() => { throw 'boom' }) // Err<DetailedError<string>>
 */
export function call<V, E, A extends any[] = []>(fn: (...args: A) => SyncResult<V,E>, ...args: A): SyncResult<V, E|DetailedError>;
export function call<V, A extends any[] = []>(fn: (...args: A) => V, ...args: A): SyncResult<V, DetailedError>;
export function call<V, E = DetailedError, A extends any[] = []>(fn: (...args: A) => SyncResult<V, E> | V, ...args: A): SyncResult<V, E | DetailedError> {
    try{
        return resolve(fn(...args)) as SyncResult<V, E | DetailedError>
    } catch(e) {
        return rejectWithError(e) as SyncResult<V, E | DetailedError>
    }
}
