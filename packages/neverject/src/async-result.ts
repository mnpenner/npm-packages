import type {Result} from './result.ts'
import {NeverjectError} from './error.ts'

export const INTERNAL_CONSTRUCT = Symbol('AsyncResultCtor')


export class AsyncResult<V, E> implements PromiseLike<Result<V, E>> {
    private constructor(private readonly promise: Promise<Result<V, E>>) {
    }

    static [INTERNAL_CONSTRUCT]<V, E>(promise: Promise<Result<V, E>>) {
        return new AsyncResult<V, E>(promise)
    }

    then<TResult1 = Result<V, E>, TResult2 = never>(onfulfilled?: ((value: Result<V, E>) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): PromiseLike<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, cause => {
            const error = new NeverjectError('AsyncResult cannot be rejected', {cause})
            return onrejected ? onrejected(error) : Promise.reject(error)
        }) as PromiseLike<TResult1 | TResult2>
    }

}
