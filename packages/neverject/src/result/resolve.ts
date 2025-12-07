import {ok, type Err, type Ok, type Result} from '../result.ts'
import {isResult} from './type-check.ts'

/**
 * Preserve an existing [`Ok`]{@link Ok} result while ensuring it stays normalized.
 *
 * @typeParam V - Value payload type.
 * @param result - An [`Ok`]{@link Ok} instance to return.
 * @returns The same successful [`Ok`]{@link Ok} result.
 * @example
 * const existing = ok(123)
 * const normalized = resolve(existing)
 * console.assert(normalized === existing)
 */
export function resolve<V>(result: Ok<V>): Ok<V>;

/**
 * Preserve an existing [`Err`]{@link Err} result while ensuring it stays normalized.
 *
 * @typeParam E - Error payload type.
 * @param result - An [`Err`]{@link Err} instance to return.
 * @returns The same failed [`Err`]{@link Err} result.
 * @example
 * const existing = err('nope')
 * const normalized = resolve(existing)
 * console.assert(normalized === existing)
 */
export function resolve<E>(result: Err<E>): Err<E>;

/**
 * Preserve any [`Result`]{@link Result} without changing its outcome.
 *
 * @typeParam V - Value payload type.
 * @typeParam E - Error payload type.
 * @param result - A [`Result`]{@link Result} instance to return.
 * @returns The same [`Result`]{@link Result} instance.
 * @example
 * const maybe = Math.random() > 0.5 ? ok('yes') : err('no')
 * const normalized = resolve(maybe)
 * console.assert(normalized === maybe)
 */
export function resolve<V, E>(result: Result<V, E>): Result<V, E>;

/**
 * Normalize a plain value into an [`Ok`]{@link Ok} result.
 *
 * @typeParam V - Value payload type.
 * @param value - Any plain value to lift.
 * @returns An [`Ok`]{@link Ok} containing the provided value.
 * @example
 * const normalized = resolve('hi')
 * console.assert(normalized.ok && normalized.value === 'hi')
 */
export function resolve<V>(value: V): Ok<V>;

export function resolve<V, E>(value: Result<V, E> | V): Result<V, E> {
    return isResult(value) ? value : ok(value)
}
