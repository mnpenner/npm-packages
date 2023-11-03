


export function mapIter<T,U>(iterable: Iterable<T>, cb: (x:T)=>U): U[] {
    const out = []
    for(const x of iterable) {
        out.push(cb(x))
    }
    return out
}

export function getStringTag(value: any): string {
    // https://github.com/lodash/lodash/blob/2da024c3b4f9947a48517639de7560457cd4ec6c/.internal/getTag.js
    if (value == null) {
        return value === undefined ? 'Undefined' : 'Null'
    }
    return  Object.prototype.toString.call(value).slice(8, -1)
}

export function isEmpty(children: any): boolean {
    return children == null || (Array.isArray(children) && children.length === 0)
}
