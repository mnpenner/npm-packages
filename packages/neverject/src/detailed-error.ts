export type DetailedError<T = unknown> = Error & { details?: T }

/**
 * Preserve an existing `Error` instance when converting to [`DetailedError`]{@link DetailedError}.
 *
 * @typeParam T - Error subtype.
 * @param x - The incoming error instance.
 * @returns The same error instance, unchanged.
 * @example
 * const original = new Error('boom')
 * const detailed = toDetailedError(original)
 * console.assert(detailed === original)
 */
export function toDetailedError<T extends Error>(x: T): T;

/**
 * Wrap any non-error value inside a [`DetailedError`]{@link DetailedError}, capturing the original as `details`.
 *
 * @typeParam T - The raw rejection reason type.
 * @param x - Any non-error value.
 * @returns A [`DetailedError`]{@link DetailedError} describing the value.
 * @example
 * const detailed = toDetailedError('oops')
 * console.assert(detailed.details === 'oops')
 */
export function toDetailedError<T>(x: T): DetailedError<T>;
export function toDetailedError(x: unknown): DetailedError {
    if(x instanceof Error) return x

    let message = 'Rejected Promise'

    if(x !== null && x !== undefined) {
        try {
            const stringified = String(x)

            if(stringified !== '[object Object]') {
                const firstLine = stringified.split(/\r?\n/, 1)[0]!
                message += `: ${firstLine}`
                if(message.length > 200) {
                    message = message.slice(0, 197) + '...'
                }
            }
        } catch {
            // Handles rare edge cases like Object.create(null) where String(x) might throw
        }
    }

    const e = new Error(message) as DetailedError
    e.details = x
    return e
}
