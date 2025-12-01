import {_INTERNAL_RESULT_MARKER} from './util/type-check.ts'
import {varDump} from './var-dump.ts'

type InspectOptionsLike = { stylize?: (value: string, styleType: string) => string }
type InspectLike = (value: unknown, options?: InspectOptionsLike) => string

let utilInspect: InspectLike | undefined
let inspectCustomSymbol: symbol | undefined
let inspectHooksInstalled = false

function stylizeLabel(label: 'Ok' | 'Err', options?: InspectOptionsLike): string {
    const stylize = options?.stylize
    if (typeof stylize !== 'function') return label

    const style = label === 'Ok' ? 'string' : 'regexp'
    return stylize(label, style)
}

function formatPayload(payload: unknown, options?: InspectOptionsLike, inspector?: InspectLike): string {
    const inspectFn = inspector ?? utilInspect
    if (inspectFn) {
        try {
            return inspectFn(payload, options)
        } catch { /* fall back */ }
    }

    return varDump(payload)
}

function formatInspect(label: 'Ok' | 'Err', payload: unknown, options?: InspectOptionsLike, inspector?: InspectLike): string {
    return `${stylizeLabel(label, options)}(${formatPayload(payload, options, inspector)})`
}

function installInspectHooks(): void {
    if (inspectHooksInstalled) return

    const {inspectFn, custom} = resolveInspectIntegration()

    if (typeof inspectFn !== 'function' || typeof custom !== 'symbol') return

    utilInspect = inspectFn
    inspectCustomSymbol = custom

    Object.defineProperty(Err.prototype, custom, {
        configurable: true,
        enumerable: false,
        writable: false,
        value(this: Err<unknown>, _depth: number, options: InspectOptionsLike = {}, inspect?: InspectLike): string {
            return formatInspect('Err', this.error, options, inspect ?? inspectFn)
        },
    })

    Object.defineProperty(Ok.prototype, custom, {
        configurable: true,
        enumerable: false,
        writable: false,
        value(this: Ok<unknown>, _depth: number, options: InspectOptionsLike = {}, inspect?: InspectLike): string {
            return formatInspect('Ok', this.value, options, inspect ?? inspectFn)
        },
    })

    inspectHooksInstalled = true
}

function resolveInspectIntegration(): { inspectFn?: InspectLike, custom?: symbol } {
    const utilInspectFn = (globalThis as { util?: { inspect?: InspectLike & { custom?: symbol } } }).util?.inspect
    const utilCustom = utilInspectFn?.custom
    if (typeof utilInspectFn === 'function' && typeof utilCustom === 'symbol') {
        return {inspectFn: utilInspectFn, custom: utilCustom}
    }

    const bunInspectFn = (globalThis as { Bun?: { inspect?: InspectLike & { custom?: symbol } } }).Bun?.inspect
    const bunCustom = bunInspectFn?.custom
    if (typeof bunInspectFn === 'function' && typeof bunCustom === 'symbol') {
        return {inspectFn: bunInspectFn, custom: bunCustom}
    }

    return {}
}

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
        installInspectHooks()
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
        installInspectHooks()
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
