export class NeverjectError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = 'NeverjectError'

        Object.setPrototypeOf(this, new.target.prototype)
    }
}
