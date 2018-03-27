
export function forEach(iterable, callback) {
    let promises = [];
    for(let x of iterable) {
        promises.push(callback(x));
    }
    return Promise.all(promises);
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

export async function forEachLimit(array, limit, callback) {
    for(let chunk of chunkArray(array, limit)) {
        await Promise.all(chunk.map(x => callback(x)));
    }
}

export function parallel(...funcs) {
    return Promise.all(funcs.map(f => typeof f === 'function' ? f() : f));
}