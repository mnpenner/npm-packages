import {isFunction} from './Types';
import {wrapMethods} from './Function';

// Developer note: all of these functions, witht he exception of chain() should utilize `this`


export default function chain(fn) {
    return function chainWrap(...args) {
        return this::fn(this, ...args);
    }
}

export function thru(callback) {
    return callback(this);
}

export function tap(callback) {
    callback(this);
    return this;
}
