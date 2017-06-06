import {arrayMap} from './collection';
import {allSettled,FULFILLED} from './promise';

const {reduce} = Array.prototype;

export const __skip__ = Symbol('skip');

/**
 * Filter-map. Like map, but you may omit entries by returning `__skip__`.
 *
 * @param callback
 * @deprecated
 */
export default function fmap(callback) {
    return this::reduce((accum, ...args) => {
        let x = this::callback(...args);
        if(x !== __skip__) {
            accum.push(x);
        }
        return accum;
    }, []);
}


export function filterMap(iterable, callback) {
    let accum = [];
    
    for(let x of iterable) {
        let y = callback(x);
        if(y !== __skip__) {
            accum.push(y);
        }
    }
    
    return accum;
}

export function filterMapAsync(iterable, callback) {
    return allSettled(arrayMap(iterable, callback))
        .then(array => filterMap(array, r => r.state === FULFILLED ? r.value : __skip__))
}