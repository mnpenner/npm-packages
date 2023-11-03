


export function mapIter<T,U>(iterable: Iterable<T>, cb: (x:T)=>U): U[] {
    const out = []
    for(const x of iterable) {
        out.push(cb(x))
    }
    return out
}
