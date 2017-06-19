import * as util from 'util';

type Errback<TRet> = (err: Error|undefined, result: TRet) => void;
type NodeFn<T1,T2,T3,T4,T5,T6,TRet> = ((callback: Errback<TRet>) => void) 
    | ((arg1: T1, callback: Errback<TRet>) => void) 
    | ((arg1: T1, arg2: T2, callback: Errback<TRet>) => void) 
    | ((arg1: T1, arg2: T2, arg3: T3, callback: Errback<TRet>) => void) 
    | ((arg1: T1, arg2: T2, arg3: T3, arg4: T4, callback: Errback<TRet>) => void) 
    | ((arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, callback: Errback<TRet>) => void) 
    | ((arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6, callback: Errback<TRet>) => void) 

/**
 * Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function. The node function should conform to node.js convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument.
 */
export function promisify<TResult>(nodeFunction: Function): (...args: any[]) => Promise<TResult> {
    return function(this: any, ...args: any[]) {
        return new Promise((resolve, reject) => {
            nodeFunction.call(this, ...args, (err: NodeJS.ErrnoException|undefined, data: TResult) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        });
    };
}

export const FULFILLED = 'fulfilled';
export const REJECTED = 'rejected';

// same API as Q: https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
export function allSettled(promises: Array<Promise<any>>) {
    return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
        state: FULFILLED,
        value: v,
    }), r => ({
        state: REJECTED,
        reason: r,
    }))));
}
