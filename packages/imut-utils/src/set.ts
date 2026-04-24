import type {ID, nil} from './types'

/**
 * Add or remove a value from a set.
 */
export function setCheck<T>(set: Set<T> | nil, value: T, add: boolean): Set<T> {
    const ret = new Set(set)
    if(add) {
        ret.add(value)
    } else {
        ret.delete(value)
    }
    return ret
}

export function fpSetCheck<T>(value: T, add: boolean): ID<Set<T>> {
    return (set: Set<T>|nil) => setCheck(set, value, add)
}


/**
 * Adds one or more values to a set.
 */
export function setAdd<T>(set: Set<T>|nil, ...values: T[]): Set<T> {
    return new Set([...set??[], ...values])
}

export function fpSetAdd<T>(...values: T[]): ID<Set<T>> {
    return (set: Set<T>|nil) => setAdd(set, ...values)
}

/**
 * Removes one or more values to a set.
 */
export function setRemove<T>(set: Set<T> | nil, ...values: T[]): Set<T> {
    const ret = new Set(set)
    for(const v of values) {
        ret.delete(v)
    }
    return ret
}

export function fpSetRemove<T>(...values: T[]): ID<Set<T>> {
    return (set: Set<T>|nil) => setRemove(set, ...values)
}

/**
 * Merge/union sets or other iterables.
 */
export function setUnion<T>(...sets: Iterable<T>[]): Set<T> {
    return new Set(sets.flatMap(a => Array.from(a)))
}

export function setIntersection<T>(a: Set<T>, b:Set<T>): Set<T> {
    const out = new Set<T>()
    for(let v of a) {
        if(b.has(v)) {
            out.add(v)
        }
    }
    return out
}

export function setSymmetricDifference<T>(a: Set<T>, b:Set<T>): Set<T> {
    const out = new Set<T>()
    for(let v of a) {
        if(!b.has(v)) {
            out.add(v)
        }
    }
    for(let v of b) {
        if(!a.has(v)) {
            out.add(v)
        }
    }
    return out
}
