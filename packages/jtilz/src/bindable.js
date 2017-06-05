import {isFunction} from './isType';
import {wrapMethods} from './function';

export default function bindable(fn) {
    return function boundFn(...args) {
        return this !== undefined && this.__esModule !== true ? this::fn(this, ...args) : this::fn(...args);
    }
}


export const bindableAll = module => wrapMethods(module, bindable);