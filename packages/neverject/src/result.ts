import {_INTERNAL_RESULT_MARKER} from './util/type-check.ts'
import {varDump} from './var-dump.ts'
import type {InspectOptionsStylized} from 'util'

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

if (typeof process !== 'undefined') {
    // Node.js and Bun look for this specific global symbol.
    // We use Symbol.for to avoid needing to `import 'util'`.
    const nodeInspectCustom = Symbol.for('nodejs.util.inspect.custom')

    type InspectFn = (value: unknown, options?: any) => string

    type InspectOptions = import('node:util').InspectOptionsStylized

    // Helper to format the label (Ok/Err) using Node's native colors/styles
    const formatLabel = (label: 'Ok' | 'Err', options: InspectOptions) => {
        if(typeof options.stylize !== 'function') return label
        // 'string' usually maps to Green, 'regexp' usually maps to Red in Node default themes
        const style = label === 'Ok' ? 'string' : 'regexp'
        return options.stylize(label, style)
    }

    // The injector function
    const injectHook = (
        TargetClass: Function,
        label: 'Ok' | 'Err',
        propName: 'value' | 'error'
    ) => {
        Object.defineProperty(TargetClass.prototype, nodeInspectCustom, {
            configurable: true,
            enumerable: false,
            writable: false,
            // Node/Bun passes the current `inspect` function as the 3rd argument.
            // We use that instead of the global `util.inspect` to respect current depth/options.
            value(this: any, _depth: number, options: InspectOptions, inspect: InspectFn) {
                const innerValue = this[propName]
                // Recurse using the runtime-provided inspector
                const formattedValue = inspect(innerValue, options)
                return `${formatLabel(label, options)}(${formattedValue})`
            },
        })
    }

    injectHook(Ok, 'Ok', 'value')
    injectHook(Err, 'Err', 'error')
}
