export type DetailedError<T = unknown> = Error & { details?: T }

export function toDetailedError<T extends Error>(x: T): T;
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
