import type { ID, nil } from '../types'
import { setAdd as _setAdd, setCheck as _setCheck, setRemove as _setRemove } from '../imp/set'

/**
 * Add or remove a value from a set.
 */
export function setCheck<T>(value: T, add: boolean): ID<Set<T>> {
  return (set: Set<T> | nil) => _setCheck(set, value, add)
}

/**
 * Adds one or more values to a set.
 */
export function setAdd<T>(...values: T[]): ID<Set<T>> {
  return (set: Set<T> | nil) => _setAdd(set, ...values)
}

/**
 * Removes one or more values from a set.
 */
export function setRemove<T>(...values: T[]): ID<Set<T>> {
  return (set: Set<T> | nil) => _setRemove(set, ...values)
}
