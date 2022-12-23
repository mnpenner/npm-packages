import {Resolvable, resolveValue} from './resolvable'

/**
 * Set a key in a Map.
 */
export function mapSet<K, V>(map: Map<K, V>, key: K, value: V): Map<K, V> {
    const ret = new Map(map)
    ret.set(key, value)
    return ret
}

export function fpMapSet<K, V>(key: K, value: Resolvable<V, [V|undefined]>) {
    return (map: Map<K, V>) => mapSet(map, key, resolveValue(value, map.get(key)))
}

//https://stackoverflow.com/a/74881032/65387
// export function fpMapSet<M extends Map<unknown, unknown>, K=MapKeyType<M>, V=MapValueType<M>>(key: K, value: Resolvable<V, [V|undefined]>) {
//     return (map: Map<K, V>) => mapSet(map, key, resolveValue(value, map.get(key)))
// }

export function fpMergeMap<K,V>(values: Resolvable<Iterable<readonly [K, Resolvable<V, [V|undefined]>]>>) {
    return (map: Map<K, V>) => {
        const ret = new Map(map)
        for(const [k,v] of resolveValue(values)) {
            ret.set(k,resolveValue(v,map.get(k)))
        }
        return ret
    }
}
