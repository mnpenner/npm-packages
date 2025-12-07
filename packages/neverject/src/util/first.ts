import {NeverjectPromise} from '../neverject-promise.ts'
import {err, ok, type Result} from '../result.ts'
import {nj} from '../nj.ts'
import type {ToSyncResult} from './all-settled.ts'
import type {MaybePromise} from '../maybe-promise.ts'

type NormalizedValue<T> = ToSyncResult<T> extends Result<infer V, any> ? V : never
type NormalizedError<T> = ToSyncResult<T> extends Result<any, infer E> ? E : never

export type FirstSettledValue<T extends readonly unknown[]> = NormalizedValue<T[number]>
export type FirstSettledError<T extends readonly unknown[]> = NormalizedError<T[number]>

export type FirstOkValue<T extends readonly unknown[]> = NormalizedValue<T[number]>
export type FirstOkError<T extends readonly unknown[]> = NormalizedError<T[number]>

type FirstInput = NeverjectPromise<any, any> | MaybePromise<any>

/**
 * Resolve to the first settled [`Result`]{@link Result} from a collection of values, promises, or [`NeverjectPromise`]{@link NeverjectPromise} instances.
 *
 * @typeParam T - Tuple of inputs to race.
 * @param inputs - Non-empty list of entries to race for the earliest settlement.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} carrying whichever entry settles first, whether `Ok` or `Err`.
 * @example
 * const settled = await firstSettled([
 *     nj(Promise.resolve(1)),
 *     nj(err('too slow')),
 * ])
 * console.assert(settled.ok && settled.value === 1)
 */
export function firstSettled<T extends readonly [FirstInput, ...FirstInput[]]>(
    inputs: T
): NeverjectPromise<FirstSettledValue<T>, FirstSettledError<T>> {
    const promise = Promise.race(
        inputs.map((value) => Promise.resolve(nj(value as unknown)))
    ) as Promise<Result<FirstSettledValue<T>, FirstSettledError<T>>>

    return NeverjectPromise.fromSafePromise(promise)
}

/**
 * Alias for [`firstSettled`]{@link firstSettled}: race inputs and settle with the earliest [`Result`]{@link Result}.
 *
 * @typeParam T - Tuple of inputs to race.
 * @param inputs - Non-empty list of entries to race for the earliest settlement.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} carrying whichever entry settles first, whether `Ok` or `Err`.
 * @example
 * const settled = await race([
 *     nj(Promise.resolve(1)),
 *     nj(err('too slow')),
 * ])
 */
export function race<T extends readonly [FirstInput, ...FirstInput[]]>(
    inputs: T
): NeverjectPromise<FirstSettledValue<T>, FirstSettledError<T>> {
    return firstSettled(inputs)
}

/**
 * Resolve to the first `Ok` value among a collection of values, promises, or [`NeverjectPromise`]{@link NeverjectPromise} instances, returning all errors if none succeed.
 *
 * @typeParam T - Tuple of inputs to compete for the first success.
 * @param inputs - Non-empty list of entries to scan for an `Ok` result.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that settles to the earliest `Ok`, or `Err` containing every failure when no entry succeeds.
 * @example
 * const settled = await firstOk([
 *     nj(err('fail fast')),
 *     nj(Promise.resolve(2)),
 * ])
 * console.assert(settled.ok && settled.value === 2)
 */
export function firstOk<T extends readonly [FirstInput, ...FirstInput[]]>(
    inputs: T
): NeverjectPromise<FirstOkValue<T>, FirstOkError<T>[]> {
    const promise: Promise<Result<FirstOkValue<T>, FirstOkError<T>[]>> = new Promise((resolve) => {
        const errors: FirstOkError<T>[] = []
        let pending = inputs.length

        inputs.forEach((value, index) => {
            Promise.resolve(nj(value as unknown)).then((settled) => {
                if(settled.ok) {
                    resolve(ok(settled.value as FirstOkValue<T>))
                    return
                }

                errors[index] = settled.error as FirstOkError<T>
                pending -= 1

                if(pending === 0) {
                    resolve(err(errors as FirstOkError<T>[]))
                }
            })
        })
    })

    return NeverjectPromise.fromSafePromise(promise)
}

/**
 * Alias for [`firstOk`]{@link firstOk}: resolve to the earliest `Ok`, or collect all errors when every input fails.
 *
 * @typeParam T - Tuple of inputs to compete for the first success.
 * @param inputs - Non-empty list of entries to scan for an `Ok` result.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that settles to the earliest `Ok`, or `Err` containing every failure when no entry succeeds.
 * @example
 * const settled = await any([
 *     nj(err('fail fast')),
 *     nj(Promise.resolve(2)),
 * ])
 * console.assert(settled.ok && settled.value === 2)
 */
export function any<T extends readonly [FirstInput, ...FirstInput[]]>(
    inputs: T
): NeverjectPromise<FirstOkValue<T>, FirstOkError<T>[]> {
    return firstOk(inputs)
}
