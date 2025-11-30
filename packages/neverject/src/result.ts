import {_INTERNAL_RESULT_MARKER} from './util/type-check.ts'

interface ResultInterface<T, __E> {
    readonly ok: boolean

    valueOr<U>(defaultValue: U): T | U
}

export class Err<E> implements ResultInterface<never, E> {
    constructor(readonly error: E) {
    }

    readonly ok = false
    readonly [_INTERNAL_RESULT_MARKER] = true

    valueOr<U>(defaultValue: U): U {
        return defaultValue
    }
}

export class Ok<T> implements ResultInterface<T, never> {
    constructor(readonly value: T) {
    }

    readonly ok = true
    readonly [_INTERNAL_RESULT_MARKER] = true

    valueOr<U>(_unused: U): T {
        return this.value
    }
}

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
    return new Ok(value)
}

export function err<E>(error: E): Err<E> {
    return new Err(error)
}
