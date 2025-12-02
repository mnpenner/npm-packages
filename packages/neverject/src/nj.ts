import {_INTERNAL_CTOR, NeverjectPromise} from './neverject-promise.ts'
import type {Err, Ok} from './result.ts'
import {err, type Result} from './result.ts'
import {type DetailedError} from './detailed-error.ts'
import {reject, rejectWithError, resolve} from './util'
import {isResult} from './util/type-check.ts'

/**
 * Normalize a promise-like value into a [`NeverjectPromise`]{@link NeverjectPromise}, flattening nested [`Result`]{@link Result} values and capturing rejections as [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam P - Promise payload type.
 * @param value - A promise-like value to normalize.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that resolves to `Ok` on fulfillment or `Err<DetailedError>` on rejection.
 * @example
 * const result = await nj(fetchUser(1))
 * if(result.ok) renderUser(result.value)
 */
export function nj<P>(value: PromiseLike<P>): NeverjectPromise<
    Awaited<P> extends Result<infer V, any> ? V : Awaited<P>,
    Awaited<P> extends Result<any, infer E> ? E : DetailedError<unknown>
>;

/**
 * Wrap an explicit `Error` instance into a failed [`NeverjectPromise`]{@link NeverjectPromise}.
 *
 * @typeParam E - Concrete error type.
 * @param error - The error instance to propagate.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that is already settled as `Err<Error>`.
 * @example
 * const failed = await nj(new Error('boom'))
 * if(!failed.ok) console.error(failed.error.message)
 */
export function nj<E extends Error>(error: E): NeverjectPromise<never, E>;

/**
 * Lift an existing [`Ok`]{@link Ok} result into a [`NeverjectPromise`]{@link NeverjectPromise} without altering it.
 *
 * @typeParam V - Value payload type.
 * @param result - The successful [`Result`]{@link Result} to normalize.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} containing the same successful value.
 * @example
 * const okResult = nj(ok('ready'))
 * const settled = await okResult
 * console.assert(settled.ok && settled.value === 'ready')
 */
export function nj<V>(result: Ok<V>): NeverjectPromise<V, never>;

/**
 * Lift an existing [`Err`]{@link Err} result into a [`NeverjectPromise`]{@link NeverjectPromise} without altering it.
 *
 * @typeParam E - Error payload type.
 * @param result - The failed [`Result`]{@link Result} to normalize.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} containing the same error payload.
 * @example
 * const errResult = nj(err('nope'))
 * const settled = await errResult
 * console.assert(!settled.ok && settled.error === 'nope')
 */
export function nj<E>(result: Err<E>): NeverjectPromise<never, E>;

/**
 * Normalize any [`Result`]{@link Result} into a [`NeverjectPromise`]{@link NeverjectPromise}, preserving success or failure.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @param result - The [`Result`]{@link Result} instance to wrap.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that settles with the same payload.
 * @example
 * const settled = await nj(Math.random() > 0.5 ? ok(1) : err('x'))
 * console.log(settled.ok ? settled.value : settled.error)
 */
export function nj<V, E>(result: Result<V, E>): NeverjectPromise<V, E>;

/**
 * Wrap a plain value into a successful [`NeverjectPromise`]{@link NeverjectPromise}.
 *
 * @typeParam V - Value payload type.
 * @param value - A plain value to lift.
 * @returns A successful [`NeverjectPromise`]{@link NeverjectPromise} resolving to the provided value.
 * @example
 * const wrapped = await nj(42)
 * console.assert(wrapped.ok && wrapped.value === 42)
 */
export function nj<V>(value: V): NeverjectPromise<V, never>;

/**
 * Normalize a promise-like value with a custom error mapper, producing a [`NeverjectPromise`]{@link NeverjectPromise} that re-maps rejection reasons.
 *
 * @typeParam P - Promise payload type.
 * @typeParam E - Custom error type produced by `errorFn`.
 * @param promise - Promise-like value to normalize.
 * @param errorFn - Maps rejection reasons into the desired error type.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} resolving to `Ok<P>` or `Err<E>`.
 * @example
 * const mapped = await nj(
 *     Promise.reject('boom'),
 *     (reason) => new Error(String(reason))
 * )
 * if(!mapped.ok) console.error(mapped.error.message)
 */
export function nj<P, E>(promise: PromiseLike<P>, errorFn: (e: unknown) => E): NeverjectPromise<Awaited<P>, E>;

/**
 * Normalize a [`Result`]{@link Result} while mapping any existing error through `errorFn`.
 *
 * @typeParam V - Value payload type.
 * @typeParam I - Incoming error type.
 * @typeParam E - Mapped error type.
 * @param result - The [`Result`]{@link Result} to normalize.
 * @param errorFn - Converts the existing error into a new error type.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} preserving success and remapping failure.
 * @example
 * const mapped = await nj(err(404), (code) => new Error(`Missing: ${code}`))
 * if(!mapped.ok) console.error(mapped.error.message)
 */
export function nj<V, I, E>(result: Result<V, I>, errorFn: (e: I) => E): NeverjectPromise<V, E>;

/**
 * Wrap a value while providing an error mapper used if the value behaves like a rejecting thenable.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Mapped error type.
 * @param value - Plain value or thenable to wrap.
 * @param errorFn - Maps rejection reasons when `value` rejects.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} resolving to the value or the mapped error.
 * @example
 * const guarded = await nj(
 *     Promise.reject('oops') as Promise<string>,
 *     (reason) => ({ message: String(reason) })
 * )
 * if(!guarded.ok) console.log(guarded.error.message)
 */
export function nj<V, E>(value: V, errorFn: (e: unknown) => E): NeverjectPromise<V, E>;

export function nj(value: unknown, errorFn?: (e: unknown) => unknown): NeverjectPromise<any, any> {
    if(isResult(value)) {
        if(errorFn && !value.ok) {
            return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(err(errorFn(value.error))))
        }
        return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(value))
    }

    if(value instanceof Error) {
        return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(err(value)))
    }

    return NeverjectPromise[_INTERNAL_CTOR](Promise.resolve(value).then(
            (value) => resolve(value),
            (reason) => {
                if(errorFn) {
                    return reject(errorFn(reason))
                }
                return rejectWithError(reason)
            }
        )
    )
}
