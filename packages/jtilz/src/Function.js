import {isFunction} from './Types';
import {__skip__} from './Collection';
import fmap from './fmap';



/**
 * Decorates all the functions in module.
 * 
 * @param {object} module Object containing methods.
 * @param {Function} wrapFn Accepts a function, returns a new function.
 * @returns {*}
 */
export function wrapMethods(module, wrapFn) {
    return module::fmap(v => isFunction(v) ? wrapFn(v) : __skip__);
}