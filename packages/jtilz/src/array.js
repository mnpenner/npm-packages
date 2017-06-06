import {isFunction,isString} from './isType';
import bindable from './bindable';
import {identity} from './value';
import {toArray} from './collection';

export const flatten = bindable(arrayOfArrays => Array.prototype.concat(...arrayOfArrays));

export const map = bindable((array,callback) => toArray(array).map(callback));

export const filterAsync = bindable((array, mapCb, filterCb=identity) => {
    return Promise.all(array.map(mapCb)).then(results => array.filter((_, i) => filterCb(results[i])));
});

/**
 * Map and flatten
 */
export const flatMap = bindable((array, callback) => array::map(callback)::flatten());

export const groupBy = bindable(function groupBy(array, grouper) {
    return array.reduce((acc,val,idx) => {
        let key = grouper(val,idx);
        if(acc[key]) {
            acc[key].push(val);
        } else {
            acc[key] = [val];
        }
        return acc;
    }, Object.create(null));
});

export const thru = bindable((array,callback) => callback(array));

export const tap = bindable((array,callback) => {
    callback(array);
    return array;
});



/**
 * Removes one instance of `value` from `array`, without mutating the original array. Uses loose comparison.
 *
 * @param {Array} array Array to remove value from
 * @param {*|Function} value Value to remove
 * @returns {Array} Array with `value` removed
 */
export function arrayWithout(array, value) {
    let func = value;
    if(typeof value !== 'function') {
        func = (v,i) => v == value;
    }
    for(let i=0; i<array.length; ++i) {
        if(func(array[i],i)) {
            return arraySplice(array, i);
        }
    }
    return array;
}

/**
 * Removes an index from an array without mutating the original array.
 *
 * @param {Array} array Array to remove value from
 * @param {Number} index Index to remove
 * @param {Number} count
 * @param {Array} replaceWith
 * @returns {Array} Array with `value` removed
 */
export function arraySplice(array, index, count=1, replaceWith=[]) {
    if(index < array.length) {
        let copy = [...array];
        copy.splice(index, count, ...replaceWith);
        return copy;
    }
    return array;
}

/**
 * Checks if `value` is in collection. Uses loose comparison.
 *
 * @param {Array} array
 * @param {*} value
 * @returns {boolean}
 */
export function arrayIncludes(array, value) {
    for(let val of array) {
        if(val == value) {
            return true;
        }
    }
    return false;
}