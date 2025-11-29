
export class NeverjectError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = 'NeverjectError'

        Object.setPrototypeOf(this, new.target.prototype)
    }
}


export type DetailedError<T = unknown> = Error & { details?: T }

export function toError<T extends Error>(x: T): T;
export function toError<T>(x: T): DetailedError<T>;
export function toError(x: unknown): DetailedError {
    if(x instanceof Error) return x

    let message = 'Unknown error'

    if(x !== null && x !== undefined) {
        try {
            const stringified = String(x)

            if(stringified !== '[object Object]') {
                message = stringified
            }
        } catch {
            // Handles rare edge cases like Object.create(null) where String(x) might throw
        }
    }

    const e = new Error(message) as DetailedError
    e.details = x
    return e
}
