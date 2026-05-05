import type { nil } from '../types'
import {
  arrayPush as _arrayPush,
  arrayPop as _arrayPop,
  arrayInsert as _arrayInsert,
  arrayInsertSorted as _arrayInsertSorted,
  arrayUnshift as _arrayUnshift,
  arrayDeleteIndex as _arrayDeleteIndex,
  arrayDeleteOneValue as _arrayDeleteOneValue,
  arrayDeleteValue as _arrayDeleteValue,
  arraySelect as _arraySelect,
  arrayReject as _arrayReject,
  arraySplice as _arraySplice,
  arrayFindAndReplace as _arrayFindAndReplace,
} from '../imp/array'
import type { ArrayElementResolvable, ArrayPredicate } from '../imp/array'

/**
 * Appends elements onto the end of the array.
 */
export function arrayPush<T>(...values: T[]) {
  return (a: T[] | nil) => _arrayPush(a, ...values)
}

/**
 * Pops an element off the end of the array.
 */
export function arrayPop<T>(howMany = 1) {
  return (a: T[] | nil) => _arrayPop(a, howMany)
}

/**
 * Insert one or more elements into an array at the given position.
 */
export function arrayInsert<T>(index: number, ...values: T[]) {
  return (a: T[] | nil) => _arrayInsert(a, index, ...values)
}

/**
 * Insert numbers into a sorted array, using binary search to find their position.
 *
 * @param values Values to insert. These needn't be sorted; each one will be searched for individually.
 */
export function arrayInsertSorted(...values: number[]) {
  return (a: number[] | nil) => _arrayInsertSorted(a, ...values)
}

/**
 * Prepends elements onto the end of the array.
 */
export function arrayUnshift<T>(...values: T[]) {
  return (a: T[] | nil) => _arrayUnshift(a, ...values)
}

/**
 * Deletes elements from an array by index.
 */
export function arrayDeleteIndex<T>(...indices: number[]) {
  return (a: T[] | nil) => _arrayDeleteIndex(a, ...indices)
}

/**
 * Deletes up to one element from an array, searching by value.
 * @deprecated
 */
export function arrayDeleteOneValue<T>(value: T, strict: boolean) {
  return (a: T[] | nil) => _arrayDeleteOneValue(a, value, strict)
}

/**
 * Deletes up to one element from an array, searching by value.
 */
export function arrayDeleteValue<T>(value: T, strict: boolean, limit?: number) {
  return (a: T[] | nil) => _arrayDeleteValue(a, value, strict, limit)
}

/**
 * Filters the array to elements that pass the predicate.
 * If limit is provided, returned array will be at most that length.
 */
export function arraySelect<T>(predicate: (v: T, i: number) => boolean, limit?: number) {
  return (a: T[] | nil) => _arraySelect(a, predicate, limit)
}

/**
 * Removes elements for which the predicate returns true.
 * If limit is provided, at most that many elements will be deleted. i.e. new length will be >= array.length - limit.
 */
export function arrayReject<T>(predicate: (v: T, i: number) => boolean, limit?: number) {
  return (a: T[] | nil) => _arrayReject(a, predicate, limit)
}

/**
 * Replaces `count` elements starting at the given `index` with `replaceWith` elements.
 */
export function arraySplice<T>(index: number, count = 1, ...replaceWith: T[]) {
  return (a: T[] | nil) => _arraySplice(a, index, count, ...replaceWith)
}

export function arrayFindAndReplace<T>(
  predicate: ArrayPredicate<T>,
  replaceWith: ArrayElementResolvable<T>,
) {
  return (a: T[] | nil) => _arrayFindAndReplace(a ?? [], predicate, replaceWith)
}
