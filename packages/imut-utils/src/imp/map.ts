import type { Resolvable } from '../resolvable'
import { resolveValue } from '../resolvable'
import type { nil } from '../types'

/**
 * Set a key in a Map.
 */
export function mapSet<K, V>(
  map: Map<K, V> | nil,
  key: K,
  value: Resolvable<V, [V | undefined, K]>,
): Map<K, V> {
  const ret = new Map(map)
  ret.set(key, resolveValue(value, ret.get(key), key))
  return ret
}

/**
 * Delete one or more keys from a map.
 */
export function mapDelete<K, V>(map: Map<K, V> | nil, ...keys: K[]): Map<K, V> {
  const ret = new Map(map)
  for (const k of keys) {
    ret.delete(k)
  }
  return ret
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
export function mapPush<K, V>(map: Map<K, V[]>, key: K, ...value: V[]): void {
  const arr = map.get(key)
  if (arr === undefined) {
    map.set(key, value)
  } else {
    arr.push(...value)
  }
}
