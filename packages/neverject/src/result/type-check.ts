import type {Result} from '../result.ts'

export const _INTERNAL_RESULT_MARKER = Symbol('Result')

/**
 * Determine whether a value is a [`Result`]{@link Result} created by this library.
 *
 * @param x - Value to inspect.
 * @returns `true` when `x` carries the internal result marker; otherwise `false`.
 * @example
 * import {err, isResult, ok} from 'neverject'
 * const maybe = Math.random() > 0.5 ? ok(1) : err('nope')
 * console.assert(isResult(maybe))
 * console.assert(!isResult({ok: true, value: 1}))
 */
export function isResult(x: unknown): x is Result<unknown, unknown> {
    return (
        typeof x === 'object' &&
        x !== null &&
        _INTERNAL_RESULT_MARKER in x
    )
}
