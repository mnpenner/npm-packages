import type { Resolvable } from '../resolvable'
import { resolveValue } from '../resolvable'
import type { AnyFn, nil } from '../types'

const ownKeys: <T extends object>(o: T) => Array<keyof T> = Reflect.ownKeys as AnyFn

/**
 * Merge one or more objects into a target object, similar to
 * [`Object.assign`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign}, but each value can be a function that takes the previous value for that key and returns a new one.
 *
 * The target object *should* be the full object (with all keys defined), and the objects to be merged may be partial.
 * If the target and objects to be merged do not sum up to the full object, then the return type will be invalid.
 */
export function shallowMerge<T extends {}>(
  ...objects: Array<{
    [K in keyof T]?: Resolvable<T[K], [T[K], K]>
  }>
): (obj: T) => T {
  return (obj: T) => {
    const filtered = objects.filter((o) => o != null)
    if (!filtered.length) {
      return obj
    }
    const ret = { __proto__: null, ...obj } as T
    for (const o of filtered) {
      for (const k of ownKeys(o)) {
        ret[k] = resolveValue(o[k], ret[k], k) as T[keyof T]
      }
    }
    return ret
  }
}

/**
 * Exactly the same as {@link shallowMerge} but the types are relaxed to accept `undefined` and `null`. You may want
 * to use this version when the target object is potentially undefined but you know that the to-be merged objects will
 * result in a full object. This version is harder for TypeScript to infer the proper type, so you may need to
 * explicitly pass `<T>`.
 */
export const relaxedMerge: {
  <T>(
    ...objects: Array<
      | {
          [K in keyof T]?: Resolvable<T[K], [T[K], K]>
        }
      | nil
    >
  ): (obj: T | nil) => T & {}
} = shallowMerge as any

/**
 * Create an immutable updater that replaces one object property with a resolved value.
 *
 * @example
 * ```ts
 * type Size = {
 *   width: number
 *   height: number
 * }
 *
 * const growWidth = objSet<Size>('width', (width) => width + 64)
 * const next = growWidth({ width: 512, height: 768 })
 * // { width: 576, height: 768 }
 * ```
 *
 * @param key - The property key to replace.
 * @param value - The next value, or a function that receives the previous value and returns the next value.
 * @returns A function that copies the input object and replaces the selected property.
 */
export function objSet<T extends {}>(
  key: keyof T,
  value: Resolvable<T[typeof key], [T[typeof key]]>,
) {
  return (obj: T) => ({ __proto__: null, ...obj, [key]: resolveValue(value, obj[key]) }) as T
}
