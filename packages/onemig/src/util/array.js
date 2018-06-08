
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

export const EMPTY_ARRAY = [];

export function toIter(x) {
    // https://jsperf.com/generator-vs-array-e98rvh098ear
    if(x == null) return EMPTY_ARRAY;
    if(typeof x !== 'string' && typeof x[Symbol.iterator] === 'function') {
        return x;
    }
    return [x];
}