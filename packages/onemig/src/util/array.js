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

export function ciCompare(a, b) {
    return a.localeCompare(b, undefined, {sensitivity: 'base'})
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
export function shuffle(a) {
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}