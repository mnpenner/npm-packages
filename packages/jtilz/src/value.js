import {isFunction} from './isType';

export function value(f, ...args) {
    return isFunction(f) ? this::f(...args) : f;
}