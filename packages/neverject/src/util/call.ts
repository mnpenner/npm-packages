import {type Err, type Ok, type Result} from '../result.ts'
import {type DetailedError} from '../detailed-error.ts'
import {rejectWithError} from './reject.ts'
import {resolve} from './resolve.ts'
import {nj} from '../nj.ts'
import {type NeverjectPromise} from '../neverject-promise.ts'

type Awaitable<T> = T | PromiseLike<T>

/**
 * Invoke a sync function and normalize its return into a {@linkcode Result}, capturing thrown errors as `Err<DetailedError>`.
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


/**
 * Invoke an async function and normalize its outcome into an {@linkcode NeverjectPromise}, capturing thrown errors and promise rejections as `Err<DetailedError>`.
 *
 * @example
 * const asyncResult = callAsync(async (id: number) => fetchUser(id))
 * const settled = await asyncResult
 * if(settled.ok) renderUser(settled.value)
 *
 * @example
 * const failed = await callAsync(() => Promise.reject('boom'))
 * if(!failed.ok) console.error(failed.error.details) // 'boom'
 */
export function callAsync<A extends any[] = []>(fn: (...args: A) => Awaitable<never>, ...args: A): NeverjectPromise<never, DetailedError<unknown>>;
export function callAsync<V, A extends any[] = []>(fn: (...args: A) => Awaitable<Ok<V>>, ...args: A): NeverjectPromise<V, never>;
export function callAsync<E, A extends any[] = []>(fn: (...args: A) => Awaitable<Err<E>>, ...args: A): NeverjectPromise<never, E>;
export function callAsync<V, E, A extends any[] = []>(fn: (...args: A) => Awaitable<Result<V, E>>, ...args: A): NeverjectPromise<V, E>;
export function callAsync<V, A extends any[] = []>(fn: (...args: A) => Awaitable<V>, ...args: A): NeverjectPromise<V, DetailedError<unknown>>;
export function callAsync<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Awaitable<Result<V, E> | V>, ...args: A): NeverjectPromise<V, E | DetailedError<unknown>> {
    const promisedResult = Promise.try(fn, ...args) as PromiseLike<Result<V, E> | V>
    return nj(promisedResult) as NeverjectPromise<V, E | DetailedError<unknown>>
}
