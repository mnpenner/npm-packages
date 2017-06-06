import {isFunction,isString} from './isType';
import bindable from './bindable';

export const toArray = bindable(function toArray(obj) {
    if(obj === null || obj === undefined) {
        return [];
    }
    if(Array.isArray(obj)) {
        return obj;
    }
    if(isString(obj)) {
        return [obj];
    }
    if(isFunction(obj[Symbol.iterator])) {
        return [...obj];
    }
    return [obj];
});


export const toSet = bindable(function toSet(obj) {
    if(obj instanceof Set) {
        return obj;
    }
    return new Set(toArray(obj));
});

/**
 * Creates a new array with the results of calling a provided function on every element of an iterable.
 * 
 * @param {*} iterable Any iterable object.
 * @param {Function} callback Function that produces an element of the new Array, taking one argument: the current element being processed.
 * @returns {Array}
 */
export function arrayMap(iterable, callback) {
    let out = [];
    for(let x of iterable) {
        out.push(callback(x));
    }
    return out;
}