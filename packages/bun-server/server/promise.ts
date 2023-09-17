import {AnyFn, UnkFn} from './util'


export enum PromiseStatus {
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected',
}


// Similar to jQuery's Deferred or AbortController
export class Deferred<TValue, TError extends Error = Error> {
    readonly promise: Promise<TValue>
    resolve!: (x: TValue) => void
    reject!: (x: TError) => void
    status: PromiseStatus = PromiseStatus.PENDING

    constructor() {
        this.promise = new Promise<TValue>((resolve,reject) => {
            this.resolve = (x: TValue) => {
                this.status = PromiseStatus.FULFILLED
                resolve(x)
            }
            this.reject = (x: TError) => {
                this.status = PromiseStatus.REJECTED
                reject(x)
            }
        })
    }

    get isPending() {
        return this.status === PromiseStatus.PENDING
    }

    get isFulfilled() {
        return this.status === PromiseStatus.FULFILLED
    }

    get isRejected() {
        return this.status === PromiseStatus.REJECTED
    }
}
