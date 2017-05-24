import {isFunction,isString} from './isType';
import bindable from './bindable';

export const flatten = bindable(function flatten(arrayOfArrays) {
    return Array.prototype.concat(...arrayOfArrays);
});

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
