import { AsyncResult, INTERNAL_CONSTRUCT} from './async-result.ts'
import type {Err, Ok} from './sync-result.ts';
import { err, isSyncResult, ok, type SyncResult} from './sync-result.ts'
import {toDetailedError, type DetailedError} from './detailed-error.ts'

export function nj<P>(promise: PromiseLike<P>): AsyncResult<
    Awaited<P> extends SyncResult<infer V, any> ? V : Awaited<P>,
    Awaited<P> extends SyncResult<any, infer E> ? E : DetailedError<unknown>
>;
export function nj<E extends Error>(error: E): AsyncResult<never, E>;
export function nj<V>(result: Ok<V>): AsyncResult<V, never>;
export function nj<E>(result: Err<E>): AsyncResult<never, E>;
export function nj<V,E>(result: SyncResult<V,E>): AsyncResult<V,E>;
export function nj<V>(value: V): AsyncResult<V,never>;

export function nj<P,E>(promise: PromiseLike<P>, errorFn: (e:unknown)=>E): AsyncResult<Awaited<P>, E>;
export function nj<V, I, E>(result: SyncResult<V, I>, errorFn: (e: I) => E): AsyncResult<V, E>;
export function nj<V,E>(value: V, errorFn: (e:unknown)=>E): AsyncResult<V, E>;

export function nj(value: unknown, errorFn?: (e: unknown) => unknown): AsyncResult<any, any> {
    if(isSyncResult(value)) {
        if(errorFn && !value.ok) {
            return AsyncResult[INTERNAL_CONSTRUCT](Promise.resolve(err(errorFn(value.error))))
        }
        return AsyncResult[INTERNAL_CONSTRUCT](Promise.resolve(value))
    }

    if(value instanceof Error) {
        return AsyncResult[INTERNAL_CONSTRUCT](Promise.resolve(err(value)))
    }

    return AsyncResult[INTERNAL_CONSTRUCT](Promise.resolve(value).then(
            (value) => isSyncResult(value) ? value : ok(value),
            (reason) => {
                if (errorFn) {
                    reason = errorFn(reason)
                } else if(!isSyncResult(reason)) {
                    return err(toDetailedError(reason))
                }
                return isSyncResult(reason) ? reason : err(reason)
            }
        )
    )
}
