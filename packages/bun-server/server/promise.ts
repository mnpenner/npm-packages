import {AnyFn, UnkFn} from './util'


export enum PromiseStatus {
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected',
}


// Similar to jQuery's Deferred or AbortController
export class Deferred<TValue=void, TError extends Error = Error> {
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

    get isSettled() {
        return this.status !== PromiseStatus.PENDING
    }

    get isFulfilled() {
        return this.status === PromiseStatus.FULFILLED
    }

    get isRejected() {
        return this.status === PromiseStatus.REJECTED
    }
}

// class Deferred2<TValue, TError extends Error = Error> implements PromiseLike<TValue>{
//     status: PromiseStatus = PromiseStatus.PENDING
//     onfulfilled: AnyFn[] = []
//     onrejected: AnyFn[] = []
//
//
//
//     resolve(x: TValue) {
//
//     }
//
//     reject(e: TError) {
//
//     }
//
//     get isPending() {
//         return this.status === PromiseStatus.PENDING
//     }
//
//     get isSettled() {
//         return this.status !== PromiseStatus.PENDING
//     }
//
//     get isFulfilled() {
//         return this.status === PromiseStatus.FULFILLED
//     }
//
//     get isRejected() {
//         return this.status === PromiseStatus.REJECTED
//     }
//
//     then<TResult1 = TValue, TResult2 = never>(
//         onfulfilled?: ((value: TValue) => (PromiseLike<TResult1> | TResult1)) | undefined | null,
//         onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): PromiseLike<TResult1 | TResult2> {
//         if(onfulfilled) {
//             if(this.isPending) {
//                 this.onfulfilled.push(onfulfilled)
//             } else {
//
//             }
//         }
//     }
//
// }
