/**
 * 
 * @param {Function} fn
 * @returns {Function}
 * @deprecated Will cause function incorrectly when variable on LHS is undefined or a module
 */
export default function bindable(fn) {
    return function boundFn(...args) {
        return this !== undefined && this.__esModule !== true ? this::fn(this, ...args) : this::fn(...args);
    }
}
