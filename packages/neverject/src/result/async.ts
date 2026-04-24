import {NeverjectPromise} from '../neverject-promise.ts'
import {err, ok} from '../result.ts'

/**
 * Wrap a value in an [`Ok`]{@link Ok} inside a resolved [`NeverjectPromise`]{@link NeverjectPromise}.
 *
 * @typeParam V - Value payload type.
 * @param value - The value to wrap.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that is already fulfilled with `Ok`.
 * @example
 * const userPromise = okAsync({id: 1})
 * const result = await userPromise
 * console.assert(result.ok && result.value.id === 1)
 */
export function okAsync<V>(value: V): NeverjectPromise<V, never> {
    return NeverjectPromise.fromSafePromise(Promise.resolve(ok(value)))
}

/**
 * Wrap an error payload in an [`Err`]{@link Err} inside a resolved [`NeverjectPromise`]{@link NeverjectPromise}.
 *
 * @typeParam E - Error payload type.
 * @param error - The error payload to wrap.
 * @returns A [`NeverjectPromise`]{@link NeverjectPromise} that is already fulfilled with `Err`.
 * @example
 * const failedPromise = errAsync('boom')
 * const result = await failedPromise
 * console.assert(!result.ok && result.error === 'boom')
 */
export function errAsync<E>(error: E): NeverjectPromise<never, E> {
    return NeverjectPromise.fromSafePromise(Promise.resolve(err(error)))
}
