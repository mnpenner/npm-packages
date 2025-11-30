import {AsyncResult, INTERNAL_CONSTRUCT} from './async-result.ts'
import {Err, Ok, ok, type SyncResult} from './sync-result.ts'
import {type DetailedError} from './detailed-error.ts'
import {nj} from './nj.ts'

type ToSyncResult<T> =
    T extends AsyncResult<infer V, infer E> ? SyncResult<V, E> :
        T extends Ok<infer V2> ? SyncResult<V2, never> :
            T extends Err<infer E2> ? SyncResult<never, E2> :
                T extends SyncResult<infer V3, infer E3> ? SyncResult<V3, E3> :
                    T extends PromiseLike<infer P> ?
                        P extends SyncResult<infer V4, infer E4> ? SyncResult<V4, E4> :
                            SyncResult<Awaited<P>, DetailedError<unknown>> :
                        SyncResult<T, never>

type AllResults<T extends Record<string, unknown>> = {
    [K in keyof T]: ToSyncResult<T[K]>
}

export function all<T extends Record<string, unknown>>(inputs: T): AsyncResult<AllResults<T>, never> {
    const promise = Promise.all(
        Object.entries(inputs).map(async ([key, value]) => {
            const settled = await nj(value as unknown)
            return [key, settled] as const
        })
    ).then((entries) => {
        const settledRecord = Object.fromEntries(entries) as AllResults<T>
        return ok(settledRecord)
    })

    return AsyncResult[INTERNAL_CONSTRUCT](promise)
}
