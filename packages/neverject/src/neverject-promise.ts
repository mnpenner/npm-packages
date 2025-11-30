import type {Result} from './result.ts'

import {UnreachableError} from './unreachable-error.ts'

export const _INTERNAL_CTOR = Symbol('AsyncResultCtor')


export class NeverjectPromise<V, E> implements PromiseLike<Result<V, E>> {
    private constructor(private readonly promise: Promise<Result<V, E>>) {}
    static [_INTERNAL_CTOR]<V, E>(promise: Promise<Result<V, E>>) {
        return new NeverjectPromise<V, E>(promise)
    }

    /**
     * Only use via `await`. For chaining, use {@linkcode .map}.
     */
    then<TResult1 = Result<V, E>, TResult2 = never>(onfulfilled?: ((value: Result<V, E>) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): PromiseLike<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, cause => {
            const error = new UnreachableError('NeverjectPromise unexpectedly rejected', {cause})
            return onrejected ? onrejected(error) : Promise.reject(error)
        }) as PromiseLike<TResult1 | TResult2>
    }
}
