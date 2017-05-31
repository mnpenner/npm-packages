const {reduce} = Array.prototype;

export const __skip__ = Symbol('skip');

/**
 * Filter-map. Like map, but you may omit entries by returning `__skip__`.
 *
 * @param callback
 */
export default function fmap(callback) {
    return this::reduce((accum, ...args) => {
        let x = this::callback(...args);
        // TODO: if `x` is a Promise, should we wait for it to resolve?
        if(x !== __skip__) {
            accum.push(x);
        }
        return accum;
    }, []);
}