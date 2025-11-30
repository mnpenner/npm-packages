import {err, isSyncResult, ok, type SyncResult} from '../sync-result.ts'
import {type DetailedError, toDetailedError} from '../detailed-error.ts'


export function resolve<V, E, A extends any[] = []>(fn: (...args: A) => SyncResult<V,E>, ...args: A): SyncResult<V, E|DetailedError>;
export function resolve<V, A extends any[] = []>(fn: (...args: A) => V, ...args: A): SyncResult<V, DetailedError>;
export function resolve<V, E = DetailedError, A extends any[] = []>(fn: (...args: A) => SyncResult<V, E> | V, ...args: A): SyncResult<V, E | DetailedError> {
    try{
        const result = fn(...args)
        return isSyncResult(result) ? result : ok(result)
    } catch(e) {
        return err(toDetailedError(e))
    }
}
