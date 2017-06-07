import {isArray, isFunction, isNullish, isPlainObject, isString} from './Types';
import {allSettled, FULFILLED} from './Promise';
import {flatten} from './Array';
import {identity} from './Value';

// Developer note: all of these functions should work on anything iterable (has [Symbol.iterator]) as the first argument


export const __skip__ = Symbol('skip');

/**
 * Converts any object to an array. In most cases this means
 * expanding the iterable, however, there are a few special cases.
 * 
 * `null`, `undefined` and `NaN` will return an empty array.
 * Arrays will be returned as-is to avoid a shallow copy.
 * Strings and non-iterable objects will become one-element arrays.
 * 
 * @param {*} obj
 * @param {Boolean} strict No special handling; calling on a non-iterable will throw.
 * @returns {Array}
 */
export function toArray(obj, strict=false) {
    if(strict) {
        if(obj) {
            if(isArray(obj)) {
                return obj;
            }
            if(isFunction(obj[Symbol.iterator])) {
                return [...obj];
            }
        }
        throw new Error(`Cannot convert object to array; it is not iterable.`);
    }
    if(isNullish(obj)) {
        return [];
    }
    if(isArray(obj)) {
        return obj;
    }
    if(isString(obj)) {
        return [obj];
    }
    if(isFunction(obj[Symbol.iterator])) {
        return [...obj];
    }
    return [obj];
}

export function toSet(obj) {
    if(obj instanceof Set) {
        return obj;
    }
    return new Set(toArray(obj));
}

/**
 * Creates a new array with the results of calling a provided function on every element of an iterable.
 * 
 * @param {Iterable} iterable Any iterable object.
 * @param {Function} callback Function that produces an element of the new Array, taking one argument: the current element being processed.
 * @returns {Array}
 */
export function mapArray(iterable, callback) {
    let out = [];
    let i = 0;
    for(let x of iterable) {
        out.push(callback(x, i++));
    }
    return out;
}

export function reduceArray(iterable, callback, initialValue) {
    // `reduce` is tricky to implement on arbitrary iterables
    // because if `initialValue` is not provided, we have to treat
    // the first element specially. For simplicity, just convert
    // to an array! N.B. strings will be split into chars.
    return toArray(iterable,true).reduce(callback, initialValue);
}


/**
 * Like `Array.prototype.map`, but you may omit entries by returning `__skip__`.
 *
 * @param {Object|Iterable} iterable
 * @param callback
 */
export function filterMap(iterable, callback) {
    if(isPlainObject(iterable)) {
        let accum = Object.create(null);
        
        // There's lots of ways to iterate an object, hopefully this was a good choice
        // You can't remap the keys with this
        // And the callback takes (value,key) instead of [key,value]
        for(let [k,v] of Object.entries(iterable)) {
            let y = callback(v,k);
            if(y !== __skip__) {
                accum[k] = y;
            }
        }
        
        return accum;
    } else {
        let accum = [];

        let i = 0;
        for(let x of iterable) {
            let y = callback(x, i++);
            if(y !== __skip__) {
                accum.push(y);
            }
        }

        return accum;
    }
}

export function filterMapAsync(iterable, callback) {
    return allSettled(mapArray(iterable, callback))
        .then(array => filterMap(array, r => r.state === FULFILLED ? r.value : __skip__))
}


export function filterAsync(iterable, mapCb, filterCb=identity) {
    return Promise.all(mapArray(iterable,mapCb))
        .then(results => iterable.filter((_, i) => filterCb(results[i])));
}

export function groupBy(iterable, grouper) {
    return reduceArray(iterable, (acc,val,idx) => {
        let key = grouper(val,idx);
        if(acc[key]) {
            acc[key].push(val);
        } else {
            acc[key] = [val];
        }
        return acc;
    }, Object.create(null));
}



/**
 * Map and flatten
 */
export function flatMap(iterable, callback) {
    return flatten(mapArray(iterable,callback));
}


/**
 * Checks if `value` is in collection. Uses loose comparison.
 *
 * @param {Array} iterable
 * @param {*} value
 * @returns {boolean}
 */
export function includes(iterable, value) {
    for(let val of iterable) {
        if(val == value) {
            return true;
        }
    }
    return false;
}