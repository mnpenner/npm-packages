import type { Resolvable } from '../resolvable'
import { resolveValue } from '../resolvable'
import type { AnyFn, nil } from '../types'

const ownKeys: <T extends object>(o: T) => Array<keyof T> = Reflect.ownKeys as AnyFn

type KeysOfUnion<T> = T extends T ? keyof T : never
type PatchValue<T, K extends PropertyKey> = T extends T ? (K extends keyof T ? T[K] : never) : never
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T extends symbol
          ? symbol
          : T
type ResolvedPatchValue<T> = T extends (...args: any[]) => infer R ? R : T
type MergeTarget<T> = {
  [K in KeysOfUnion<T>]: Widen<ResolvedPatchValue<PatchValue<T, K>>>
}
type InvalidPatchKeys<TObj, TPatch> = {
  [K in KeysOfUnion<TPatch>]: K extends keyof TObj
    ? PatchValue<TPatch, K> extends TObj[K]
      ? never
      : K
    : K
}[KeysOfUnion<TPatch>]
type PatchTarget<TObj, TPatch> = [InvalidPatchKeys<TObj, TPatch>] extends [never] ? TObj : never
type MergeObject<T> = {
  [K in keyof T]?: T[K] | ((value: T[K], key: K) => T[K] | Widen<T[K]>)
}
type ValueMergeObject<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : T[K]
}
type ValueMergeObjects<T extends ReadonlyArray<object>> = {
  [K in keyof T]: T[K] extends object ? ValueMergeObject<T[K]> : T[K]
}
type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * Merge one or more objects into a target object, similar to
 * [`Object.assign`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign}, but each value can be a function that takes the previous value for that key and returns a new one.
 *
 * The target object *should* be the full object (with all keys defined), and the objects to be merged may be partial.
 * If the target and objects to be merged do not sum up to the full object, then the return type will be invalid.
 */
export function shallowMerge<T extends {}>(
  ...objects: Array<NoInfer<MergeObject<T>>>
): (obj: T) => T
export function shallowMerge<const T extends ReadonlyArray<object>>(
  ...objects: IsAny<T> extends true ? never : ValueMergeObjects<T>
): <TObj extends object>(obj: PatchTarget<TObj, T[number]>) => TObj
export function shallowMerge<T extends {}>(...objects: Array<MergeObject<T>>): (obj: T) => T {
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
  <const T extends ReadonlyArray<object | nil>>(
    ...objects: T
  ): <TObj extends MergeTarget<NonNullable<T[number]>>>(obj: TObj | nil) => TObj & {}
  <T>(...objects: Array<MergeObject<T> | nil>): (obj: T | nil) => T & {}
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
