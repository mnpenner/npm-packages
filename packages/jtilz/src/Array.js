import {isFunction,isString} from './Types';

// Developer note: all of these functions should take an array as the first argument


export function flatten(arrayOfArrays) {
 return Array.prototype.concat(...arrayOfArrays);   
}




/**
 * Removes one instance of `value` from `array`, without mutating the original array. Uses loose comparison.
 *
 * @param {Array} array Array to remove value from
 * @param {*|Function} value Value to remove
 * @returns {Array} Array with `value` removed
 */
export function without(array, value) {
    let func = value;
    if(!isFunction(value)) {
        func = (v,i) => v == value;
    }
    for(let i=0; i<array.length; ++i) {
        if(func(array[i],i)) {
            return splice(array, i);
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
export function splice(array, index, count=1, replaceWith=[]) {
    if(index < array.length) {
        let copy = [...array];
        copy.splice(index, count, ...replaceWith);
        return copy;
    }
    return array;
}
