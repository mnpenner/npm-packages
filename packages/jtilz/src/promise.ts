/**
 * Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function. The node function should conform to node.js convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument.
 */
export function promisify(nodeFunction: Function) {
    return function(this: any, ...args: any[]) {
        return new Promise((resolve, reject) => {
            nodeFunction.call(this, ...args, (err: Error|undefined, data: any) => {
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
