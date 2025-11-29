import type {SyncResult} from './sync-result.ts'
import {NeverjectError} from './error.ts'

export const INTERNAL_CONSTRUCT = Symbol('AsyncResultCtor')


export class AsyncResult<V, E> implements PromiseLike<SyncResult<V, E>> {
    private constructor(private readonly promise: Promise<SyncResult<V, E>>) {
    }

    static [INTERNAL_CONSTRUCT]<V, E>(promise: Promise<SyncResult<V, E>>) {
        return new AsyncResult<V, E>(promise)
    }

    then<TResult1 = SyncResult<V, E>, TResult2 = never>(onfulfilled?: ((value: SyncResult<V, E>) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): PromiseLike<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, cause => {
            const error = new NeverjectError('AsyncResult cannot be rejected', {cause})
            return onrejected ? onrejected(error) : Promise.reject(error)
        }) as PromiseLike<TResult1 | TResult2>
    }
}
