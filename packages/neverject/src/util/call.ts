import {type Err, type Ok, type Result} from '../result.ts'
import {type DetailedError} from '../detailed-error.ts'
import {rejectWithError} from './reject.ts'
import {resolve} from './resolve.ts'
import {nj} from '../nj.ts'

/**
 * Invoke a sync function and normalize its return into a `SyncResult`, capturing thrown errors as `Err<DetailedError>`.
 *
 * @example
 * const okResult = call(() => 1) // Ok<number>
 *
 * @example
 * const errResult = call(() => { throw 'boom' }) // Err<DetailedError<string>>
 */
export function call<A extends any[] = []>(fn: (...args: A) => never, ...args: A): Result<never, unknown>;
export function call<V, A extends any[] = []>(fn: (...args: A) => Ok<V>, ...args: A): Result<V, never>;
export function call<E, A extends any[] = []>(fn: (...args: A) => Err<E>, ...args: A): Result<never, E>;
export function call<V, E, A extends any[] = []>(fn: (...args: A) => Result<V, E>, ...args: A): Result<V, E>;
export function call<V, A extends any[] = []>(fn: (...args: A) => V, ...args: A): Result<V, DetailedError<unknown>>;
export function call<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Result<V, E> | V, ...args: A): Result<V, E | DetailedError<unknown>> {
    try {
        return resolve(fn(...args)) as Result<V, E>
    } catch(e) {
        return rejectWithError(e) as Result<V, E | DetailedError<unknown>>
    }
}


export function callAsync(fn, ...args) {
    return nj(Promise.try(fn, ...args))
}
