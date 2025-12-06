import {type Err, type Ok, type Result} from '../result.ts'
import {toDetailedError, type DetailedError} from '../detailed-error.ts'
import {resolve} from './resolve.ts'
import {nj} from '../nj.ts'
import { NeverjectPromise} from '../neverject-promise.ts'
import {reject} from './reject.ts'
import type {MaybePromise} from '../maybe-promise.ts'

type ErrorMapper<E> = (reason: unknown) => E

/**
 * Wrap a sync function that never returns (always throws) so it yields an `Err` via [`Result`]{@link Result}.
 *
 * @typeParam A - Argument tuple type.
 * @param fn - Function that is expected to throw.
 * @param onError - Optional mapper that converts thrown values into the desired error shape.
 * @returns A deferred function that returns [`Result`]{@link Result} with `Err<unknown>`.
 * @example
 * const neverReturns = wrapFn(() => { throw 'boom' })
 * const settled = neverReturns()
 * console.assert(!settled.ok)
 */
export function wrapFn<A extends any[] = []>(fn: (...args: A) => never, onError?: ErrorMapper<unknown>): (...args: A) => Result<never, unknown>;

/**
 * Wrap a sync function that already returns [`Ok`]{@link Ok}, preserving success while mapping thrown errors.
 *
 * @typeParam V - Success value type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning [`Ok`]{@link Ok}.
 * @param onError - Optional mapper for thrown values.
 * @returns A deferred function returning [`Result`]{@link Result} with `Ok<V>`.
 * @example
 * const safeAdd = wrapFn((a: number, b: number) => ok(a + b))
 * const result = safeAdd(1, 2)
 * console.assert(result.ok && result.value === 3)
 */
export function wrapFn<V, A extends any[] = []>(fn: (...args: A) => Ok<V>, onError?: ErrorMapper<unknown>): (...args: A) => Result<V, never>;

/**
 * Wrap a sync function that already returns [`Err`]{@link Err}, keeping the error payload intact.
 *
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning [`Err`]{@link Err}.
 * @param onError - Optional mapper for thrown values.
 * @returns A deferred function returning [`Result`]{@link Result} with `Err<E>`.
 * @example
 * const alwaysErr = wrapFn(() => err('nope'))
 * const result = alwaysErr()
 * console.assert(!result.ok && result.error === 'nope')
 */
export function wrapFn<E, A extends any[] = []>(fn: (...args: A) => Err<E>, onError?: ErrorMapper<unknown>): (...args: A) => Result<never, E>;

/**
 * Wrap a sync function that already returns a [`Result`]{@link Result}, forwarding either outcome while mapping thrown errors.
 *
 * @typeParam V - Success value type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning a [`Result`]{@link Result}.
 * @param onError - Optional mapper for thrown values.
 * @returns A deferred function returning the same [`Result`]{@link Result} shape.
 * @example
 * const safeDivide = wrapFn((a: number, b: number) => b === 0 ? err('bad') : ok(a / b))
 * const result = safeDivide(4, 2)
 * console.assert(result.ok && result.value === 2)
 */
export function wrapFn<V, E, A extends any[] = []>(fn: (...args: A) => Result<V, E>, onError?: ErrorMapper<E>): (...args: A) => Result<V, E>;

/**
 * Wrap a sync function that returns a plain value, capturing thrown errors as [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam V - Success value type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning a raw value.
 * @param onError - Optional mapper for thrown values to [`DetailedError`]{@link DetailedError}.
 * @returns A deferred function returning [`Result`]{@link Result} with mapped errors.
 * @example
 * const safeParse = wrapFn((value: string) => JSON.parse(value) as { id: number })
 * const parsed = safeParse('{\"id\":1}')
 * console.assert(parsed.ok && parsed.value.id === 1)
 */
export function wrapFn<V, A extends any[] = []>(fn: (...args: A) => V, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => Result<V, DetailedError<unknown>>;

/**
 * Wrap a sync function that may return either a plain value or a [`Result`]{@link Result}, normalizing both and mapping thrown errors.
 *
 * @typeParam V - Success value type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Function returning `V` or [`Result`]{@link Result}.
 * @param onError - Optional mapper for thrown values.
 * @returns A deferred function returning normalized [`Result`]{@link Result}.
 * @example
 * const maybe = wrapFn((flag: boolean) => flag ? 1 : err('no'))
 * const result = maybe(false)
 * console.assert(!result.ok && result.error === 'no')
 */
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
 * Wrap an async function that never fulfills successfully (always rejects or throws), yielding [`NeverjectPromise`]{@link NeverjectPromise} with mapped errors.
 *
 * @typeParam A - Argument tuple type.
 * @param fn - Async function that rejects.
 * @param onError - Optional mapper for rejection reasons into [`DetailedError`]{@link DetailedError}.
 * @returns A deferred function returning [`NeverjectPromise`]{@link NeverjectPromise} with `Err<DetailedError>`.
 * @example
 * const alwaysRejects = wrapAsyncFn(async () => { throw 'boom' })
 * const result = await alwaysRejects()
 * console.assert(!result.ok)
 */
export function wrapAsyncFn<A extends any[] = []>(fn: (...args: A) => MaybePromise<never>, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => NeverjectPromise<never, DetailedError<unknown>>;

/**
 * Wrap an async function that returns [`Ok`]{@link Ok}, preserving success while mapping thrown errors.
 *
 * @typeParam V - Success value type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning [`Ok`]{@link Ok}.
 * @param onError - Optional mapper for rejection reasons.
 * @returns A deferred function returning [`NeverjectPromise`]{@link NeverjectPromise} with `Ok<V>`.
 * @example
 * const getOk = wrapAsyncFn(async (id: number) => ok({ id }))
 * const result = await getOk(1)
 * console.assert(result.ok && result.value.id === 1)
 */
export function wrapAsyncFn<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<Ok<V>>, onError?: ErrorMapper<never>): (...args: A) => NeverjectPromise<V, never>;

/**
 * Wrap an async function that returns [`Err`]{@link Err}, forwarding the error payload.
 *
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning [`Err`]{@link Err}.
 * @param onError - Optional mapper for thrown or rejected values.
 * @returns A deferred function returning [`NeverjectPromise`]{@link NeverjectPromise} with `Err<E>`.
 * @example
 * const alwaysErr = wrapAsyncFn(async () => err('nope'))
 * const result = await alwaysErr()
 * console.assert(!result.ok && result.error === 'nope')
 */
export function wrapAsyncFn<E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Err<E>>, onError?: ErrorMapper<unknown>): (...args: A) => NeverjectPromise<never, E>;

/**
 * Wrap an async function that already returns a [`Result`]{@link Result}, keeping the shape while mapping thrown errors.
 *
 * @typeParam V - Success value type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning a [`Result`]{@link Result}.
 * @param onError - Optional mapper for thrown or rejected values.
 * @returns A deferred function returning [`NeverjectPromise`]{@link NeverjectPromise} mirroring the input result.
 * @example
 * const safeDivide = wrapAsyncFn(async (a: number, b: number) => b ? ok(a / b) : err('bad'))
 * const result = await safeDivide(4, 0)
 * console.assert(!result.ok && result.error === 'bad')
 */
export function wrapAsyncFn<V, E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E>>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E>;

/**
 * Wrap an async function that returns a raw value, converting thrown or rejected values into [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam V - Success value type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning a plain value.
 * @param onError - Optional mapper for rejection reasons.
 * @returns A deferred function returning [`NeverjectPromise`]{@link NeverjectPromise} with mapped errors.
 * @example
 * const safeFetch = wrapAsyncFn(async (url: string) => {
 *     const res = await fetch(url)
 *     if(!res.ok) throw res.statusText
 *     return res.json() as Promise<{ id: number }>
 * })
 * const fetched = await safeFetch('https://example.test/user')
 * if(fetched.ok) console.log(fetched.value.id)
 * else console.error(fetched.error.details)
 */
export function wrapAsyncFn<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<V>, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => NeverjectPromise<V, DetailedError<unknown>>;

/**
 * Wrap an async function that may return either a raw value or a [`Result`]{@link Result}, normalizing both into [`NeverjectPromise`]{@link NeverjectPromise}.
 *
 * @typeParam V - Success value type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning `V` or [`Result`]{@link Result}.
 * @param onError - Optional mapper for rejection reasons.
 * @returns A deferred function returning normalized [`NeverjectPromise`]{@link NeverjectPromise}.
 * @example
 * const maybe = wrapAsyncFn(async (flag: boolean) => flag ? 1 : err('bad'))
 * const settled = await maybe(false)
 * console.assert(!settled.ok && settled.error === 'bad')
 */
export function wrapAsyncFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E> | V>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E>;
export function wrapAsyncFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E> | V>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E> {
    const mapError = (onError ?? toDetailedError) as ErrorMapper<E>
    return (...args: A) => {
        const promise = Promise.try(fn, ...args)
            .then((value) => resolve(value as Result<V, E> | V))
            .catch((error) => reject(mapError(error)) as Result<V, E>)

        return nj(promise) as NeverjectPromise<V, E>
    }
}

/**
 * Wrap a safe async function that already returns [`Ok`]{@link Ok} and never rejects, deferring invocation while preserving success.
 *
 * @typeParam V - Success value type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning [`Ok`]{@link Ok} without ever throwing or rejecting.
 * @returns A deferred function yielding [`NeverjectPromise`]{@link NeverjectPromise} with `Ok<V>`.
 * @example
 * const wrapped = wrapSafeAsyncFn(async (value: number) => ok(value + 1))
 * const settled = await wrapped(4)
 * console.assert(settled.ok && settled.value === 5)
 */
export function wrapSafeAsyncFn<V, A extends any[] = []>(fn: (...args: A) => PromiseLike<Ok<V>>): (...args: A) => NeverjectPromise<V, never>;

/**
 * Wrap a safe async function that already returns [`Err`]{@link Err} and never rejects, deferring invocation while preserving the error.
 *
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning [`Err`]{@link Err} without ever throwing or rejecting.
 * @returns A deferred function yielding [`NeverjectPromise`]{@link NeverjectPromise} with `Err<E>`.
 * @example
 * const wrapped = wrapSafeAsyncFn(async () => err('nope'))
 * const settled = await wrapped()
 * console.assert(!settled.ok && settled.error === 'nope')
 */
export function wrapSafeAsyncFn<E, A extends any[] = []>(fn: (...args: A) => PromiseLike<Err<E>>): (...args: A) => NeverjectPromise<never, E>;

/**
 * Wrap a safe async function that returns a [`Result`]{@link Result} without ever rejecting, deferring invocation while forwarding the outcome.
 *
 * @typeParam V - Success value type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning a [`Result`]{@link Result} and never rejecting.
 * @returns A deferred function yielding [`NeverjectPromise`]{@link NeverjectPromise} that mirrors the input result.
 * @example
 * const wrapped = wrapSafeAsyncFn(async (value: number) => value > 0 ? ok(value) : err('bad'))
 * const settled = await wrapped(1)
 * console.assert(settled.ok && settled.value === 1)
 */
export function wrapSafeAsyncFn<V, E, A extends any[] = []>(fn: (...args: A) => PromiseLike<Result<V, E>>): (...args: A) => NeverjectPromise<V, E>;

/**
 * Wrap a safe async function that already resolves to a [`Result`]{@link Result} without ever rejecting, producing a deferred [`NeverjectPromise`]{@link NeverjectPromise}. Any rejection is a programmer error; use [`wrapAsyncFn`]{@link wrapAsyncFn} when you need rejection mapping.
 *
 * @typeParam V - Success value type.
 * @typeParam E - Error payload type.
 * @typeParam A - Argument tuple type.
 * @param fn - Async function returning a [`Result`]{@link Result} and guaranteed never to reject or throw.
 * @returns A deferred function yielding the same [`Result`]{@link Result}.
 * @example
 * const wrapped = wrapSafeAsyncFn(async () => err('boom'))
 * const settled = await wrapped()
 * console.assert(!settled.ok && settled.error === 'boom')
 */
export function wrapSafeAsyncFn<V, E = never, A extends any[] = []>(fn: (...args: A) => PromiseLike<Result<V, E>>): (...args: A) => NeverjectPromise<V, E>;

export function wrapSafeAsyncFn<V, E = never, A extends any[] = []>(fn: (...args: A) => PromiseLike<Result<V, E>>): (...args: A) => NeverjectPromise<V, E> {
    return (...args: A) => NeverjectPromise.fromSafePromise(fn(...args))}
