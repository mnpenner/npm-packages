import {NeverjectPromise, _INTERNAL_CTOR} from '../neverject-promise.ts'
import type {Err, Ok} from '../result.ts'
import {err, ok, type Result} from '../result.ts'
import {type DetailedError} from '../detailed-error.ts'
import {nj} from '../nj.ts'

export type ToSyncResult<T> =
    T extends NeverjectPromise<infer V, infer E> ? Result<V, E> :
        T extends Ok<infer V2> ? Result<V2, never> :
            T extends Err<infer E2> ? Result<never, E2> :
                T extends Result<infer V3, infer E3> ? Result<V3, E3> :
                    T extends PromiseLike<infer P> ?
                        P extends Result<infer V4, infer E4> ? Result<V4, E4> :
                            Result<Awaited<P>, DetailedError<unknown>> :
                        Result<T, never>

export type AllSettledObject<T extends Record<string, unknown>> = {
    [K in keyof T]: ToSyncResult<T[K]>
}

export type AllSettledArray<T extends readonly unknown[]> = {
    [K in keyof T]: ToSyncResult<T[K]>
}

export type AllOkValues<T extends readonly unknown[]> = {
    [K in keyof T]: ToSyncResult<T[K]> extends Result<infer V, any> ? V : never
}

export type AllOkErrors<T extends readonly unknown[]> = ToSyncResult<T[number]> extends Result<any, infer E> ? E : never

export type AllOkObject<T extends Record<string, unknown>> = {
    [K in keyof T]: ToSyncResult<T[K]> extends Result<infer V, any> ? V : never
}

type AllOkObjectErrors<T extends Record<string, unknown>> = ToSyncResult<T[keyof T]> extends Result<any, infer E> ? E : never

/**
 * Aggregate any values/promises/AsyncResults into a single AsyncResult of per-entry SyncResults. Never returns Err.
 */
export function allSettled<T extends readonly (NeverjectPromise<any, any> | PromiseLike<any> | unknown)[]>(inputs: T): NeverjectPromise<AllSettledArray<T>, never> {
    const promise: Promise<Result<AllSettledArray<T>, never>> = Promise.all(
        inputs.map(async (value) => nj(value as unknown))
    ).then((settled) => ok(settled as AllSettledArray<T>))

    return NeverjectPromise[_INTERNAL_CTOR](promise)
}

/**
 *  Aggregate any values/promises/AsyncResults into a single AsyncResult of per-key SyncResults. Never returns Err.
 */
export function allSettledObj<T extends Record<string, NeverjectPromise<any, any> | PromiseLike<any> | unknown>>(inputs: T): NeverjectPromise<AllSettledObject<T>, never> {
    const entries = Object.entries(inputs)
    const promise: Promise<Result<AllSettledObject<T>, never>> = Promise.resolve(
        allSettled(entries.map(([, value]) => value))
    ).then((settled) => {
        // allSettled never Errs, but keep a narrow check for type safety
        if(!settled.ok) {
            return settled
        }
        const rebuilt = Object.fromEntries(
            settled.value.map((result, index) => [entries[index]![0], result])
        ) as AllSettledObject<T>
        return ok(rebuilt)
    })

    return NeverjectPromise[_INTERNAL_CTOR](promise)
}

/**
 * Aggregate into AsyncResult of Ok values, short-circuiting on the first Err.
 */
export function allOk<T extends readonly (NeverjectPromise<any, any> | PromiseLike<any> | unknown)[]>(inputs: T): NeverjectPromise<AllOkValues<T>, AllOkErrors<T>> {
    const promise: Promise<Result<AllOkValues<T>, AllOkErrors<T>>> = (async () => {
        const values: unknown[] = []
        for(const value of inputs) {
            const settled = await nj(value as unknown)
            if(!settled.ok) {
                return err(settled.error as AllOkErrors<T>)
            }
            values.push(settled.value)
        }
        return ok(values as AllOkValues<T>)
    })()

    return NeverjectPromise[_INTERNAL_CTOR](promise)
}

/**
 * Aggregate into AsyncResult of Ok values keyed by input object, short-circuiting on the first Err.
 */
export function allOkObj<T extends Record<string, NeverjectPromise<any, any> | PromiseLike<any> | unknown>>(inputs: T): NeverjectPromise<AllOkObject<T>, AllOkObjectErrors<T>> {
    const entries = Object.entries(inputs)
    const promise: Promise<Result<AllOkObject<T>, AllOkObjectErrors<T>>> = Promise.resolve(
        allOk(entries.map(([, value]) => value))
    ).then((settled) => {
        if(!settled.ok) {
            return err(settled.error as AllOkObjectErrors<T>)
        }
        const rebuilt = Object.fromEntries(
            settled.value.map((value, index) => [entries[index]![0], value])
        ) as AllOkObject<T>
        return ok(rebuilt)
    })

    return NeverjectPromise[_INTERNAL_CTOR](promise)
}
