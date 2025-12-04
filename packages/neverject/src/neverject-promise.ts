import {ok, type Result} from './result.ts'

import {UnreachableError} from './unreachable-error.ts'
import type {MaybePromise} from './maybe-promise.ts'
import {reject, resolve} from './util'

export const _INTERNAL_CTOR = Symbol('AsyncResultCtor')

type NormalizedValue<V, E> = NeverjectPromise<V, E> | MaybePromise<Result<V, E> | V>
type NormalizedError<V, E> = NeverjectPromise<V, E> | MaybePromise<Result<V, E> | E>

function normalizeResult<V, E>(value: NormalizedValue<V, E>): Promise<Result<V, E>> {
    return Promise.resolve(value)
        .then((resolved) => resolve(resolved) as Result<V, E>)
        .catch((reason) => reject(reason) as Result<V, E>)
}

function normalizeErrResult<V, E>(value: NormalizedError<V, E>): Promise<Result<V, E>> {
    return Promise.resolve(value)
        .then((resolved) => reject(resolved) as Result<V, E>)
        .catch((reason) => reject(reason) as Result<V, E>)
}

export class NeverjectPromise<V, E> implements PromiseLike<Result<V, E>> {
    // Constructor is private. Use `nj`.
    private constructor(private readonly promise: Promise<Result<V, E>>) {
    }

    static [_INTERNAL_CTOR]<V, E>(promise: Promise<Result<V, E>>) {
        return new NeverjectPromise<V, E>(promise)
    }

    /**
     * Await this [`NeverjectPromise`]{@link NeverjectPromise} as you would a native promise, receiving a
     * [`Result`]{@link Result}. Prefer chaining with [`map`]{@link NeverjectPromise#map} or
     * [`mapErr`]{@link NeverjectPromise#mapErr} to keep error handling consistent.
     *
     * @typeParam TResult1 - Fulfillment callback return type.
     * @typeParam TResult2 - Rejection callback return type.
     * @param onfulfilled - Runs with the settled [`Result`]{@link Result} value.
     * @param onrejected - Runs if the underlying promise unexpectedly rejects, receiving an
     *     [`UnreachableError`]{@link UnreachableError}.
     * @returns A `PromiseLike` that adopts the return of `onfulfilled`/`onrejected`.
     * @example
     * const settled = await nj(fetchUser(1))
     * const json = await settled.then((result) => result.ok ? result.value : result.error)
     */
    then<TResult1 = Result<V, E>, TResult2 = never>(onfulfilled?: ((value: Result<V, E>) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): PromiseLike<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, cause => {
            const error = new UnreachableError('NeverjectPromise unexpectedly rejected', {cause})
            return onrejected ? onrejected(error) : Promise.reject(error)
        }) as PromiseLike<TResult1 | TResult2>
    }

    /**
     * Transform a successful value, flattening returned [`Result`]{@link Result} or
     * [`NeverjectPromise`]{@link NeverjectPromise} instances while preserving errors.
     *
     * @typeParam NV - Mapped success type.
     * @typeParam NE - Error type produced by the mapper.
     * @param onfulfilled - Receives the successful value and may return a new value, [`Result`]{@link Result},
     *     promise, or [`NeverjectPromise`]{@link NeverjectPromise}.
     * @param onrejected - Optional mapper for the error branch; may produce a value, [`Result`]{@link Result},
     *     promise, or [`NeverjectPromise`]{@link NeverjectPromise}.
     * @returns A [`NeverjectPromise`]{@link NeverjectPromise} with the mapped success or propagated error.
     * @example
     * const doubled = await nj(ok(2)).map((value) => value * 2)
     * console.assert(doubled.ok && doubled.value === 4)
     * @example
     * const flattened = await nj(ok(2)).map((value) => value > 1 ? err('too big') : ok(value))
     * console.assert(!flattened.ok && flattened.error === 'too big')
     * @example
     * const recovered = await nj(err('missing')).map(
     *     (value) => value,
     *     (error) => ok(`default:${error}`)
     * )
     * console.assert(recovered.ok && recovered.value === 'default:missing')
     */
    map<NV, NE = E>(onfulfilled: (value: V) => NormalizedValue<NV, NE>, onrejected?: (error: E) => NormalizedValue<NV, NE>): NeverjectPromise<NV, E | NE> {
        const promise = this.promise.then(async (result) => {
            if(result.ok) {
                try {
                    return await normalizeResult<NV, NE>(onfulfilled(result.value))
                } catch(error) {
                    return reject(error) as Result<NV, E | NE>
                }
            }

            if(!onrejected) return result

            try {
                return await normalizeResult<NV, NE>(onrejected(result.error))
            } catch(error) {
                return reject(error) as Result<NV, E | NE>
            }
        })

        return new NeverjectPromise(promise as Promise<Result<NV, E | NE>>)
    }

    /**
     * Map an error payload to a new error (or even recover to an `Ok`) while leaving successful values untouched.
     *
     * @typeParam NE - New error type produced by `fn`.
     * @param fn - Receives the error payload and may return an error, [`Result`]{@link Result}, promise, or
     *     [`NeverjectPromise`]{@link NeverjectPromise}.
     * @returns A [`NeverjectPromise`]{@link NeverjectPromise} preserving successful values and mapping errors.
     * @example
     * const mapped = await nj(err('missing')).mapErr((error) => error.length)
     * console.assert(!mapped.ok && mapped.error === 7)
     * @example
     * const recovered = await nj(err('oops')).mapErr(() => ok('fixed'))
     * console.assert(recovered.ok && recovered.value === 'fixed')
     */
    mapErr<NE>(fn: (error: E) => NormalizedError<V, NE>): NeverjectPromise<V, NE> {
        const promise = this.promise.then(async (result) => {
            if(result.ok) return result as Result<V, NE>

            try {
                return await normalizeErrResult<V, NE>(fn(result.error))
            } catch(error) {
                return reject(error) as Result<V, NE>
            }
        })

        return new NeverjectPromise(promise as Promise<Result<V, NE>>)
    }

    /**
     * Rewrite the entire [`Result`]{@link Result}, allowing simultaneous transformations of both branches.
     *
     * @typeParam NV - New success type.
     * @typeParam NE - New error type produced by `fn`.
     * @param fn - Receives the settled [`Result`]{@link Result} and may return another [`Result`]{@link Result},
     *     promise, or [`NeverjectPromise`]{@link NeverjectPromise}.
     * @returns A [`NeverjectPromise`]{@link NeverjectPromise} wrapping the mapper output.
     * @example
     * const swapped = await nj(ok(1)).mapResult((result) => result.ok ? err('nope') : ok(result.error))
     * console.assert(!swapped.ok && swapped.error === 'nope')
     */
    mapResult<NV, NE = E>(fn: (result: Result<V, E>) => NormalizedValue<NV, NE>): NeverjectPromise<NV, NE> {
        const promise = this.promise.then(async (result) => {
            try {
                return await normalizeResult<NV, NE>(fn(result))
            } catch(error) {
                return reject(error) as Result<NV, NE>
            }
        })

        return new NeverjectPromise(promise as Promise<Result<NV, NE>>)
    }

    /**
     * Resolve to the successful value or a fallback when this settles as [`Err`]{@link Err}, mirroring
     * [`Err.valueOr`]{@link Err#valueOr}.
     *
     * @typeParam U - Fallback value type.
     * @param fallback - Static fallback value or a function deriving the fallback from the error.
     * @returns A promise for the unwrapped value or fallback.
     * @example
     * const value = await nj(err('missing')).valueOr('guest')
     * console.assert(value === 'guest')
     * @example
     * const dynamic = await nj(err('missing')).valueOr((error) => `missing: ${error}`)
     * console.assert(dynamic === 'missing: missing')
     */
    valueOr<U>(fallback: U | ((error: E) => U)): NeverjectPromise<V | U, never> {
        const fallbackFn = typeof fallback === 'function'
            ? fallback as (error: E) => U
            : () => fallback

        const promise = this.promise.then((result) => {
            if(result.ok) return ok(result.value as V | U)
            return ok(fallbackFn(result.error))
        })

        return new NeverjectPromise(promise)
    }

    /**
     * Run a side effect on a successful value without changing the outcome. Provide an optional error-side handler to
     * mirror {@link NeverjectPromise#map}.
     *
     * @param onfulfilled - Callback invoked on success.
     * @param onrejected - Optional callback invoked on error.
     * @returns A [`NeverjectPromise`]{@link NeverjectPromise} with the original result.
     * @example
     * const logged = await nj(ok(3)).tap((value) => console.log('value', value))
     * console.assert(logged.ok && logged.value === 3)
     */
    tap(onfulfilled: (value: V) => MaybePromise<unknown>, onrejected?: (error: E) => MaybePromise<unknown>): NeverjectPromise<V, E> {
        const promise = this.promise.then(async (result) => {
            if(result.ok) {
                try {
                    await onfulfilled(result.value)
                } catch {
                    // ignore tap errors
                }
                return result
            }

            if(onrejected) {
                try {
                    await onrejected(result.error)
                } catch {
                    // ignore tap errors
                }
            }
            return result
        })

        return new NeverjectPromise(promise as Promise<Result<V, E>>)
    }

    /**
     * Run a side effect on the entire [`Result`]{@link Result} while leaving it unchanged unless the tap fails.
     *
     * @typeParam NE - Error type produced by the tap.
     * @param fn - Callback receiving the settled [`Result`]{@link Result}; may return void, [`Result`]{@link Result},
     *     promise, or [`NeverjectPromise`]{@link NeverjectPromise}.
     * @returns A [`NeverjectPromise`]{@link NeverjectPromise} preserving the original outcome unless the tap fails.
     * @example
     * const inspected = await nj(ok(1)).tapResult((result) => console.debug(result.ok))
     * console.assert(inspected.ok && inspected.value === 1)
     */
    tapResult(fn: (result: Result<V, E>) => MaybePromise<unknown>): NeverjectPromise<V, E> {
        const promise = this.promise.then(async (result) => {
            try {
                await fn(result)
            } catch {
                // ignore tap errors
            }
            return result
        })

        return new NeverjectPromise(promise as Promise<Result<V, E>>)
    }

    /**
     * Run a side effect only when this settles as [`Err`]{@link Err}, preserving the original outcome.
     *
     * @param fn - Callback invoked on error.
     * @returns A [`NeverjectPromise`]{@link NeverjectPromise} with the original result.
     * @example
     * const loggedErr = await nj(err('fail')).tapErr((error) => console.error(error))
     * console.assert(!loggedErr.ok && loggedErr.error === 'fail')
     */
    tapErr(fn: (error: E) => MaybePromise<unknown>): NeverjectPromise<V, E> {
        const promise = this.promise.then(async (result) => {
            if(!result.ok) {
                try {
                    await fn(result.error)
                } catch {
                    // ignore tap errors
                }
            }
            return result
        })

        return new NeverjectPromise(promise as Promise<Result<V, E>>)
    }

    /**
     * Handle an error branch by producing a recovery value or mapped [`Result`]{@link Result}, leaving successful
     * values untouched.
     *
     * @typeParam RV - Recovery success type.
     * @typeParam NE - Error type produced by the recovery handler.
     * @param fn - Callback invoked when this settles as [`Err`]{@link Err}; may return a value, [`Result`]{@link
     *     Result}, promise, or [`NeverjectPromise`]{@link NeverjectPromise}.
     * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that preserves successes and replaces failures with the
     *     handler output.
     * @example
     * const recovered = await nj(err('offline')).recover(() => 'cached')
     * console.assert(recovered.ok && recovered.value === 'cached')
     */
    recover<RV, NE = E>(fn: (error: E) => NormalizedValue<RV, NE>): NeverjectPromise<V | RV, E | NE> {
        const promise = this.promise.then(async (result) => {
            if(result.ok) return result

            try {
                return await normalizeResult<RV, NE>(fn(result.error))
            } catch(error) {
                return reject(error) as Result<RV, E | NE>
            }
        })

        return new NeverjectPromise(promise as Promise<Result<V | RV, E | NE>>)
    }
}
