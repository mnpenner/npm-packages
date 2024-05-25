/**
 * Filter-map. Map over any iterable and filter out `undefined` return values.
 */
export function fmap<T, R>(iter: Iterable<T>, fn: (el: T, idx: number) => R): R[] {
    const out: R[] = []
    let i = 0
    for(const x of iter) {
        const v = fn(x, i++)
        if(v !== undefined) {
            out.push(v)
        }
    }
    return out
}

export function deepEqual(a: any, b: any): boolean {
    if(Object.is(a, b)) {
        return true
    }

    if(typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
        return false
    }

    if(Array.isArray(a) && Array.isArray(b)) {
        if(a.length !== b.length) {
            return false
        }
        for(let i = 0; i < a.length; i++) {
            if(!deepEqual(a[i], b[i])) {
                return false
            }
        }
        return true
    }

    if(Array.isArray(a) !== Array.isArray(b)) {
        return false
    }

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if(keysA.length !== keysB.length) {
        return false
    }

    for(const key of keysA) {
        if(!keysB.includes(key) || !deepEqual(a[key], b[key])) {
            return false
        }
    }

    return true
}
