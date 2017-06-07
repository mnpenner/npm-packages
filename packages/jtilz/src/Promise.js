import {isFunction} from './Types';
import bindable from './bindable';
import {wrapMethods} from './Function';

/**
 * Returns a function that will wrap the given `nodeFunction`. Instead of taking a callback, the returned function will return a promise whose fate is decided by the callback behavior of the given node function. The node function should conform to node.js convention of accepting a callback as last argument and calling that callback with error as the first argument and success value on the second argument.
 *
 * @param {Function} nodeFunction
 * @returns {Function}
 */
export function promisify(nodeFunction) {
    return function(...args) {
        return new Promise((resolve, reject) => {
            nodeFunction(...args, function(err, data) {
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

export const promisifyAll = module => wrapMethods(module, promisify);

const thenFinally = bindable((promise,callback) => {
    const res = () => promise;
    const fin = () => Promise.resolve(callback()).then(res);
    return promise.then(fin,fin);
});

// same API as Q: https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
export function allSettled(promises) {
    return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
        state: FULFILLED,
        value: v,
    }), r => ({
        state: REJECTED,
        reason: r,
    }))));
}
