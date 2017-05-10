import {isFunction,isString} from './isType';

export function flatten(arr) {
    return Array.prototype.concat(...arr);
}

export function toArray(s) {
    if(s === null || s === undefined) {
        return [];
    }
    if(Array.isArray(s)) {
        return s;
    }
    if(isString(s)) {
        return [s];
    }
    if(isFunction(s[Symbol.iterator])) {
        return [...s];
    }
    return [s];
}
