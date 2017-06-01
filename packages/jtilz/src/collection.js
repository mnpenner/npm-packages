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
