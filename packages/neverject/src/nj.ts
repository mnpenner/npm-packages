import { AsyncResult, INTERNAL_CONSTRUCT} from './async-result.ts'
import {Err, err, isResult, ok, type Result} from './result.ts'


export function nj<P>(promise: PromiseLike<P>): AsyncResult<Awaited<P>, unknown>;
export function nj<E extends Error>(error: E): AsyncResult<never, Err<E>>;
export function nj<R extends Result<any, any>>(result: R): unknown;  // FIXME

export function nj<P,E>(promise: PromiseLike<P>, errorFn: (e:unknown)=>E): AsyncResult<Awaited<P>, E>;
export function nj<R extends Result<any, any>,E>(result: R, errorFn: (e:unknown)=>E): unknown; // FIXME
export function nj<V,E>(value: V, errorFn: (e:unknown)=>E): AsyncResult<V, E>;

export function nj<E>(value: unknown, errorFn?: (e: unknown) => E): AsyncResult<any, any> {
    if(isResult(value)) {
        if(errorFn && !value.ok) {
            const newError = errorFn(value.error)
            // TODO: pass new error in
        }
        return AsyncResult[INTERNAL_CONSTRUCT](Promise.resolve(value))
    }

    return AsyncResult[INTERNAL_CONSTRUCT](Promise.resolve(value).then(
            (value) => isResult(value) ? value : ok(value),
            (reason) => {
                if (errorFn) {
                    reason = errorFn(reason)
                }
                return isResult(reason) ? reason : err(reason)
            }
        )
    )
}
