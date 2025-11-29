interface IResult<T, __E> {
    readonly ok: boolean

    valueOr<U>(defaultValue: U): T | U
}

const RESULT_MARKER = Symbol('Result')

export class Err<E> implements IResult<never, E> {
    constructor(readonly error: E) {
    }

    readonly ok = false
    readonly [RESULT_MARKER] = true

    valueOr<U>(defaultValue: U): U {
        return defaultValue
    }
}

export class Ok<T> implements IResult<T, never> {
    constructor(readonly value: T) {
    }

    readonly ok = true
    readonly [RESULT_MARKER] = true

    valueOr<U>(__unused: U): T {
        return this.value
    }
}

export function ok<T>(value: T): Ok<T> {
    return new Ok(value)
}

export function err<E>(error: E): Err<E> {
    return new Err(error)
}

export type SyncResult<T, E> = Ok<T> | Err<E>;

export function isSyncResult(x: unknown): x is SyncResult<unknown, unknown> {
    return (
        typeof x === 'object' &&
        x !== null &&
        RESULT_MARKER in x
    )
}
