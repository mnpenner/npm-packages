export default function memoize(fn, options={
    serialize: fn.length === 1 ? x => x : (...args) => JSON.stringify(args), // maybe use jsSerialize instead?
}) {
    let cache = new Map();
    return (...args) => {
        let key = options.serialize(...args);
        if(cache.has(key)) {
            return cache.get(key);
        }
        let value = fn(...args);
        cache.set(key, value);
        return value;
    }
}