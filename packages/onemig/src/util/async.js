import dump from '../dump';

export function forEach(array, callback) {
    return Promise.all(array.map(makeFulfill(callback)));
}

function chunkArray(array, chunkSize) {
    let chunkCount = Math.ceil(array.length / chunkSize);
    let chunks = new Array(chunkCount);
    for(let i = 0, j = 0, k = chunkSize; i < chunkCount; ++i) {
        chunks[i] = array.slice(j, k);
        j = k;
        k += chunkSize;
    }
    return chunks;
}

export async function forEachChunked(array, limit, callback) {
    for(let chunk of chunkArray(array, limit)) {
        await Promise.all(chunk.map(makeFulfill(callback)));
    }
}

function makeFulfill(fn) {
    return (x,i) => fulfill(fn,[x,i],i);
}

function fulfill(fn,args,val) {
    return always(call(fn,...args),_=>val);
}

function always(promise, cb) {
    return Promise.resolve(promise).then(cb,cb);
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

export async function forEachLimit(array, limit, callback) {
    // if(array.length <= limit) {
    //     return Promise.all(array.map(makeFulfill(callback)))
    // }
    let cur = limit;
    let promises = array.slice(0,limit).map(makeFulfill(callback));
    // let idx;
    // let end = array.length - 1;
    for(;cur<array.length;++cur) {
        let idx = await Promise.race(promises);
        promises.splice(idx,1,fulfill(callback,[array[cur]], idx));
    }
    // promises.splice(idx,1);
    // dump(promises);
    await Promise.all(promises);
}

export function parallel(...funcs) {
    return Promise.all(funcs.map(call));
}

function call(fn, ...args) {
    return typeof fn === 'function' ? fn.call(this, ...args) : fn;
}