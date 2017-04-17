export const __skip__ = Symbol('skip');

/**
 * Filter-map. Like map, but you may omit entries by returning `__skip__`.
 *
 * @param callback
 */
export default function fmap(callback) {
    return Array.prototype.reduce.call(this, (accum, ...args) => {
        let x = callback.call(this, ...args);
        if(x !== __skip__) {
            accum.push(x);
        }
        return accum;
    }, []);
}