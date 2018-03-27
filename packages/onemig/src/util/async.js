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
    return (x, i) => fulfill(fn, [x, i], i);
}

function fulfill(fn, args, val) {
    return always(call(fn, ...args), _ => val);
}

function always(promise, cb) {
    return Promise.resolve(promise).then(cb, cb);
}

export async function forEachLimit(array, limit, callback) {
    let promises = array.slice(0, limit).map(makeFulfill(callback));
    for(let cur = limit; cur < array.length; ++cur) {
        let idx = await Promise.race(promises);
        promises.splice(idx, 1, fulfill(callback, [array[cur]], idx));
    }
    await Promise.all(promises);
}

export async function sequence(array, callback) {
    for(let i=0; i<array.length; ++i) {
        await fulfill(callback, [array[i], i], i);
    }
}

export function parallel(...funcs) {
    return Promise.all(funcs.map(call));
}

function call(fn, ...args) {
    return typeof fn === 'function' ? fn.call(this, ...args) : fn;
}