import {type Err, type Ok, type Result} from '../result.ts'
import {toDetailedError, type DetailedError} from '../detailed-error.ts'
import {resolve} from './resolve.ts'
import {nj} from '../nj.ts'
import {type NeverjectPromise} from '../neverject-promise.ts'
import {reject} from './reject.ts'

type Awaitable<T> = T | PromiseLike<T>
type ErrorMapper<E> = (reason: unknown) => E

/**
 * Create a Result-returning wrapper around a sync function, deferring invocation until the wrapper is called.
 *
 * @example
 * const wrapped = wrapFn((a: number, b: number) => a + b)
 * const result = wrapped(1, 2) // Ok<number>
 *
 * @example
 * const safeParse = wrapFn((value: string) => JSON.parse(value) as { id: number })
 * const parsed = safeParse('{\"id\":1}')
 * if(parsed.ok) console.log(parsed.value.id)
 *
 * @example
 * type ParseError = {message: string}
 * const toParseError = (): ParseError => ({message: 'Parse Error'})
 * const safeJsonParse = wrapFn(JSON.parse, toParseError)
 * const parsed = safeJsonParse('{') // Err<ParseError>
 */
export function wrapFn<A extends any[] = []>(fn: (...args: A) => never, onError?: ErrorMapper<unknown>): (...args: A) => Result<never, unknown>;
export function wrapFn<V, A extends any[] = []>(fn: (...args: A) => Ok<V>, onError?: ErrorMapper<unknown>): (...args: A) => Result<V, never>;
export function wrapFn<E, A extends any[] = []>(fn: (...args: A) => Err<E>, onError?: ErrorMapper<unknown>): (...args: A) => Result<never, E>;
export function wrapFn<V, E, A extends any[] = []>(fn: (...args: A) => Result<V, E>, onError?: ErrorMapper<E>): (...args: A) => Result<V, E>;
export function wrapFn<V, A extends any[] = []>(fn: (...args: A) => V, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => Result<V, DetailedError<unknown>>;
export function wrapFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Result<V, E> | V, onError?: ErrorMapper<E>): (...args: A) => Result<V, E>;
export function wrapFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Result<V, E> | V, onError?: ErrorMapper<E>): (...args: A) => Result<V, E> {
    const mapError = (onError ?? toDetailedError) as ErrorMapper<E>
    return (...args: A) => {
        try {
            return resolve(fn(...args)) as Result<V, E>
        } catch(error) {
            return reject(mapError(error)) as Result<V, E>
        }
    }
}

/**
 * Create an AsyncResult-returning wrapper around an async function, deferring invocation until the wrapper is called.
 *
 * @example
 * const wrappedAsync = wrapAsyncFn(async (id: number) => fetchUser(id))
 * const settled = await wrappedAsync(123)
 *
 * @example
 * const safeFetch = wrapAsyncFn(async (url: string) => {
 *     const res = await fetch(url)
 *     if(!res.ok) throw res.statusText
 *     return res.json() as Promise<{ id: number }>
 * })
 * const fetched = await safeFetch('https://example.test/user')
 * if(fetched.ok) console.log(fetched.value.id)
 *
 * @example
 * type ParseError = {message: string}
 * const toParseError = (): ParseError => ({message: 'Parse Error'})
 * const safeJsonParse = wrapAsyncFn(JSON.parse, toParseError)
 * const parsed = await safeJsonParse('{') // Err<ParseError>
 */
export function wrapAsyncFn<A extends any[] = []>(fn: (...args: A) => Awaitable<never>, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => NeverjectPromise<never, DetailedError<unknown>>;
export function wrapAsyncFn<V, A extends any[] = []>(fn: (...args: A) => Awaitable<Ok<V>>, onError?: ErrorMapper<never>): (...args: A) => NeverjectPromise<V, never>;
export function wrapAsyncFn<E, A extends any[] = []>(fn: (...args: A) => Awaitable<Err<E>>, onError?: ErrorMapper<unknown>): (...args: A) => NeverjectPromise<never, E>;
export function wrapAsyncFn<V, E, A extends any[] = []>(fn: (...args: A) => Awaitable<Result<V, E>>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E>;
export function wrapAsyncFn<V, A extends any[] = []>(fn: (...args: A) => Awaitable<V>, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => NeverjectPromise<V, DetailedError<unknown>>;
export function wrapAsyncFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Awaitable<Result<V, E> | V>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E>;
export function wrapAsyncFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Awaitable<Result<V, E> | V>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E> {
    const mapError = (onError ?? toDetailedError) as ErrorMapper<E>
    return (...args: A) => {
        const promise = Promise.try(fn, ...args)
            .then((value) => resolve(value as Result<V, E> | V))
            .catch((error) => reject(mapError(error)) as Result<V, E>)

        return nj(promise) as NeverjectPromise<V, E>
    }
}
