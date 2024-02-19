import {Resolvable, resolveValue} from './resolvable'
import type {nil} from './types'

/**
 * Set a key in a Map.
 */
export function mapSet<K, V>(map: Map<K, V>|nil, key: K, value: Resolvable<V, [V | undefined, K]>): Map<K, V> {
    const ret = new Map(map)
    ret.set(key, resolveValue(value, ret.get(key),key))
    return ret
}

export function fpMapSet<K, V>(key: K, value: Resolvable<V, [V | undefined]>) {
    return (map: Map<K, V>|nil) => mapSet(map, key, value)
}

export function fpMaybeMapSet<K, V>(key: K, value: Resolvable<V, [V, K]>) {
    return (map: Map<K, V> | nil) => {
        if(map == null || !map.has(key)) return map
        const ret = new Map(map)
        ret.set(key, resolveValue(value, ret.get(key)!, key))
        return ret
    }
}

//https://stackoverflow.com/a/74881032/65387
// export function fpMapSet<M extends Map<unknown, unknown>, K=MapKeyType<M>, V=MapValueType<M>>(key: K, value:
// Resolvable<V, [V|undefined]>) { return (map: Map<K, V>) => mapSet(map, key, resolveValue(value, map.get(key))) }

export function fpMergeMap<K, V>(values: Resolvable<Iterable<readonly [K, Resolvable<V, [V | undefined, K]>]>,[Map<K, V>]>) {
    return (map: Map<K, V>) => {
        const ret = new Map(map)
        for(const [k, v] of resolveValue(values, map)) {
            ret.set(k, resolveValue(v, map.get(k),k))
        }
        return ret
    }
}


/**
 * Delete one or more keys from a map.
 */
export function mapDelete<K, V>(map: Map<K, V>|nil, ...keys: K[]): Map<K, V> {
    const ret = new Map(map)
    for(const k of keys) {
        ret.delete(k)
    }
    return ret
}
export function fpMapDelete<K, V>(...keys: K[]) {
    return (map: Map<K, V>|nil) => mapDelete(map,...keys)
}

/**
 * Pushes one or more values into a Map of arrays at the specified key.
 * If the key does not exist, a new array will be created.
 * Mutates the map.
 *
 * @param map Map to update
 * @param key Key to update
 * @param value Value(s) to append
 */
export function mapPush<K,V>(map: Map<K,V[]>, key: K, ...value: V[]): void {
    const arr = map.get(key)
    if(arr === undefined) {
        map.set(key, value)
    } else {
        arr.push(...value)
    }
}
