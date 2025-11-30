export class UnreachableError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = 'UnreachableError'

        Object.setPrototypeOf(this, new.target.prototype)
    }
}
