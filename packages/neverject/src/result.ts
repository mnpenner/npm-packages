import {_INTERNAL_RESULT_MARKER} from './util/type-check.ts'
import {varDump} from './var-dump.ts'

interface ResultInterface<T, __E> {
    readonly ok: boolean

    valueOr<U>(defaultValue: U): T | U
}

/**
 * Represents a failure result. Prefer the {@link err} helper to construct instances.
 *
 * @typeParam E - Error payload type.
 * @param error - The error payload to wrap.
 * @example
 * const failed = err('boom')
 * console.log(failed.toString()) // Err("boom")
 */
export class Err<E> implements ResultInterface<never, E> {
    constructor(readonly error: E) {
    }

    readonly ok = false
    readonly [_INTERNAL_RESULT_MARKER] = true

    valueOr<U>(defaultValue: U): U {
        return defaultValue
    }

    /**
     * Format the wrapped error for logging/debugging.
     *
     * @returns A human-readable string like `Err("boom")`.
     */
    toString(): string {
        return `Err(${varDump(this.error)})`
    }
}

/**
 * Represents a successful result. Prefer the {@link ok} helper to construct instances.
 *
 * @typeParam T - Value payload type.
 * @param value - The value to wrap.
 * @example
 * const success = ok(123)
 * console.log(success.toString()) // Ok(123)
 */
export class Ok<T> implements ResultInterface<T, never> {
    constructor(readonly value: T) {
    }

    readonly ok = true
    readonly [_INTERNAL_RESULT_MARKER] = true

    valueOr<U>(_unused: U): T {
        return this.value
    }

    /**
     * Format the wrapped value for logging/debugging.
     *
     * @returns A human-readable string like `Ok(123)`.
     */
    toString(): string {
        return `Ok(${varDump(this.value)})`
    }
}

export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Wrap a value in an {@link Ok} result.
 *
 * @typeParam T - Value payload type.
 * @param value - The value to wrap.
 * @returns An {@link Ok} containing the provided value.
 * @example
 * const user = ok({id: 1})
 * console.log(user.ok) // true
 */
export function ok<T>(value: T): Ok<T> {
    return new Ok(value)
}

/**
 * Wrap an error payload in an {@link Err} result.
 *
 * @typeParam E - Error payload type.
 * @param error - The error payload to wrap.
 * @returns An {@link Err} containing the provided error.
 * @example
 * const failure = err(new Error('boom'))
 * console.log(failure.ok) // false
 */
export function err<E>(error: E): Err<E> {
    return new Err(error)
}

declare global {
    interface Window {} // lets TS know Window exists
    var window: Window | undefined
}

if(typeof window === 'undefined') {  // Allow tree-shaking for the browser. Maybe.
    const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom')

    type InspectOptionsStylized = import('node:util').InspectOptionsStylized
    type StyleTextFn = typeof import('node:util').styleText
    type InspectFn = typeof import('node:util').inspect

    let styleText: StyleTextFn = (_, text) => text
    try {
        const util = await import('node:util')
        if(typeof util.styleText === 'function') {
            styleText = (colorStyle, text) => util.styleText(colorStyle, text)
        }
    } catch {
        //
    }

    Object.defineProperty(Ok.prototype, customInspectSymbol, {
        configurable: true,
        enumerable: false,
        writable: false,
        value(this: Ok<unknown>, _depth: number, options: InspectOptionsStylized, inspect: InspectFn) {
            return `${styleText('green', 'Ok')}(${inspect(this.value, options)})`
        },
    })

    Object.defineProperty(Err.prototype, customInspectSymbol, {
        configurable: true,
        enumerable: false,
        writable: false,
        value(this: Err<unknown>, _depth: number, options: InspectOptionsStylized, inspect: InspectFn) {
            return `${styleText('red', 'Err')}(${inspect(this.error, options)})`
        },
    })
}
