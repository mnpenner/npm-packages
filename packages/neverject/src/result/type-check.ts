import type {Result} from '../result.ts'

export const _INTERNAL_RESULT_MARKER = Symbol('Result')

export function isResult(x: unknown): x is Result<unknown, unknown> {
    return (
        typeof x === 'object' &&
        x !== null &&
        _INTERNAL_RESULT_MARKER in x
    )
}
