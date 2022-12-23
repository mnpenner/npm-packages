
/**
 * Add or remove a value from a set.
 */
export function setAdd<T>(set: Set<T>|undefined, value: T, add: boolean): Set<T> {
    const ret = new Set(set)
    if(add) {
        ret.add(value)
    } else {
        ret.delete(value)
    }
    return ret
}


