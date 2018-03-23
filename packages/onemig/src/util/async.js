
export function forEach(iterable, callback) {
    let promises = [];
    for(let x of iterable) {
        promises.push(callback(x));
    }
    return Promise.all(promises);
}



export function parallel(...funcs) {
    return Promise.all(funcs.map(f => typeof f === 'function' ? f() : f));
}