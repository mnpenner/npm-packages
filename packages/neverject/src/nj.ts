import { NeverjectPromise, _INTERNAL_CTOR} from './neverject-promise.ts'
import type {Err, Ok} from './result.ts';
import { err, ok, type Result} from './result.ts'
import {toDetailedError, type DetailedError} from './detailed-error.ts'
import {reject, rejectWithError, resolve} from './util'
import {isResult} from './util/type-check.ts'

export function nj<P>(promise: PromiseLike<P>): NeverjectPromise<
    Awaited<P> extends Result<infer V, any> ? V : Awaited<P>,
    Awaited<P> extends Result<any, infer E> ? E : DetailedError<unknown>
>;
export function nj<E extends Error>(error: E): NeverjectPromise<never, E>;
export function nj<V>(result: Ok<V>): NeverjectPromise<V, never>;
export function nj<E>(result: Err<E>): NeverjectPromise<never, E>;
export function nj<V,E>(result: Result<V,E>): NeverjectPromise<V,E>;
export function nj<V>(value: V): NeverjectPromise<V,never>;

export function nj<P,E>(promise: PromiseLike<P>, errorFn: (e:unknown)=>E): NeverjectPromise<Awaited<P>, E>;
export function nj<V, I, E>(result: Result<V, I>, errorFn: (e: I) => E): NeverjectPromise<V, E>;
export function nj<V,E>(value: V, errorFn: (e:unknown)=>E): NeverjectPromise<V, E>;

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
                if (errorFn) {
                    return reject(errorFn(reason))
                }
                return rejectWithError(reason)
            }
        )
    )
}
