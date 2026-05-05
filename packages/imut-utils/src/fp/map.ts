import type { Resolvable } from '../resolvable'
import { resolveValue } from '../resolvable'
import type { nil } from '../types'
import { mapDelete as _mapDelete, mapSet as _mapSet } from '../imp/map'

/**
 * Set a key in a Map.
 */
export function mapSet<K, V>(key: K, value: Resolvable<V, [V | undefined]>) {
  return (map: Map<K, V> | nil) => _mapSet(map, key, value)
}

/**
 * Update an existing value in a map.
 * Returns the map as-is if the key does not exist.
 */
export function mapUpdate<K, V>(key: K, value: Resolvable<V, [V, K]>) {
  return (map: Map<K, V>) => {
    if (!map.has(key)) return map
    const ret = new Map(map)
    ret.set(key, resolveValue(value, ret.get(key)!, key))
    return ret
  }
}

/**
 * Merge multiple entries into a map.
 */
export function mergeMap<K, V>(
  values: Resolvable<Iterable<readonly [K, Resolvable<V, [V | undefined, K]>]>, [Map<K, V>]>,
) {
  return (map: Map<K, V>) => {
    const ret = new Map(map)
    for (const [k, v] of resolveValue(values, map)) {
      ret.set(k, resolveValue(v, map.get(k), k))
    }
    return ret
  }
}

/**
 * Delete one or more keys from a map.
 */
export function mapDelete<K, V>(...keys: K[]) {
  return (map: Map<K, V> | nil) => _mapDelete(map, ...keys)
}
