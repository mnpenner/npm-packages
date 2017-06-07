import {isFunction} from './Types';

export function value(f, ...args) {
    return isFunction(f) ? this::f(...args) : f;
}

export function identity(x) {
    return x;
}