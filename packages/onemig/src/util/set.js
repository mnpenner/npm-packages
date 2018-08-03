

export function addMany(iterable) {
    for(let item of iterable) {
        this.add(item);
    }
}

/**
 * Returns the intersection of ES6 Set objects. i.e., returns a new set with only elements contained in all the given sets.
 *
 * @param {Set|Array} set1 First set
 * @param {Array<Array|Set>} sets Other sets
 * @returns {Set|Array} Intersection
 */
export function intersection(set1, ...sets) {
    if(!sets.length) {
        return set1;
    }
    const tmp = [...set1].filter(x => sets.every(y => Array.isArray(y) ? y.includes(x) : y.has(x)));
    return Array.isArray(set1) ? tmp : new Set(tmp);
}