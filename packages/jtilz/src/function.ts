import {__skip__, filterMap} from './collection';
import {isFunction} from './types';
import {IDictionary} from './type-defs';

/**
 * Decorates all the functions in module.
 *
 * @param module Object containing methods.
 * @param wrapFn Accepts a function, returns a new function.
 */
export function wrapMethods(module: IDictionary<any>, wrapFn: (fn: Function) => Function): IDictionary<Function> {
    return filterMap(module, v => isFunction(v) ? wrapFn(v) : __skip__);
}