import {isFunction} from './isType';
import bindable from './bindable';

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


export function promisifyAll(obj) {
    return Object.keys(obj)
        .filter(k => isFunction(obj[k]))
        .map(k => [k, promisify(obj[k])])
        .reduce((o, a) => {
            o[a[0]] = a[1];
            return o;
        }, {});
}

const thenFinally = bindable((promise,callback) => {
    const res = () => promise;
    const fin = () => Promise.resolve(callback()).then(res);
    return promise.then(fin,fin);
});

// same API as Q: https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
export function allSettled(promises) {
    return Promise.all(promises.map(p => Promise.resolve(p).then(v => ({
        state: 'fulfilled',
        value: v,
    }), r => ({
        state: 'rejected',
        reason: r,
    }))));
}
