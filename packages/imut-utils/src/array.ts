import type {nil} from './types'
import {binarySearch, assert} from './extra'
import {Resolvable, resolveValue} from './resolvable'

/**
 * Appends elements onto the end of the array.
 */
export function arrayPush<T>(array: T[] | nil, ...values: T[]): T[] {
    return [...array ?? [], ...values]
}

export function fpArrayPush<T>(...values: T[]) {
    return (a: T[] | nil) => arrayPush(a, ...values)
}


/**
 * Pops an element off the end of the array.
 */
export function arrayPop<T>(array: T[] | nil, howMany = 1): T[] {
    assert(Number.isInteger(howMany))
    assert(howMany >= 0)
    if(!array) return []
    if(howMany === 0) return array
    return array.slice(0, -howMany)
}

export function fpArrayPop<T>(howMany = 1) {
    return (a: T[] | nil) => arrayPop(a, howMany)
}

/**
 * Insert one or more elements into an array at the given position.
 */
export function arrayInsert<T>(array: T[] | nil, index: number, ...values: T[]): T[] {
    const copy = array ? [...array] : []
    copy.splice(index, 0, ...values)
    return copy
}

export function fpArrayInsert<T>(index: number, ...values: T[]) {
    return (a: T[] | nil) => arrayInsert(a, index, ...values)
}

/**
 * Insert numbers into a sorted array, using binary search to find their position.
 *
 * @param array Array of numbers. Must be sorted in ascending order.
 * @param values Values to insert. These needn't be sorted; each one will be searched for individually.
 */
export function arrayInsertSorted(array: number[] | nil, ...values: number[]): number[] {
    const copy = array ? [...array] : []
    for(const v of values) {
        const index = binarySearch(copy, v)
        copy.splice(index < 0 ? ~index : index, 0, v)
    }
    return copy
}

export function fpArrayInsertSorted<T>(...values: number[]) {
    return (a: number[] | nil) => arrayInsertSorted(a, ...values)
}


/**
 * Prepends elements onto the end of the array.
 */
export function arrayUnshift<T>(array: T[] | nil, ...values: T[]): T[] {
    return [...values, ...array ?? []]
}

export function fpArrayUnshift<T>(...values: T[]) {
    return (a: T[] | nil) => arrayUnshift(a, ...values)
}

/**
 * Deletes elements from an array by index.
 */
export function arrayDeleteIndex<T>(array: T[] | nil, ...indices: number[]): T[] {
    if(!array?.length) return []
    indices.sort((a, b) => b - a)
    const ret = [...array]
    for(const i of indices) {
        ret.splice(i, 1)
    }
    return ret
}

export function fpArrayDeleteIndex<T>(...indices: number[]) {
    return (a: T[] | nil) => arrayDeleteIndex(a, ...indices)
}

function looseEq(a: any, b: any) {
    return a == b
}

function fpLooseEq(value: any) {
    return (other: any) => other == value
}

function fpStrictEq(value: any) {
    return (other: any) => Object.is(value, other)
}

/**
 * Deletes up to one element from an array, searching by value.
 * @deprecated
 */
export function arrayDeleteOneValue<T>(array: T[] | nil, value: T, strict: boolean): T[] {
    if(!array?.length) return []
    const idx = array.findIndex((strict ? fpStrictEq : fpLooseEq)(value))
    return idx < 0 ? array : arrayDeleteIndex(array, idx)
}

/**
 * @deprecated
 */
export function fpArrayDeleteOneValue<T>(value: T, strict: boolean) {
    return (a: T[] | nil) => arrayDeleteOneValue(a, value, strict)
}

/**
 * Deletes up to one element from an array, searching by value.
 */
export function arrayDeleteValue<T>(array: T[] | nil, value: T, strict: boolean, limit?: number): T[] {
    return arrayReject(array, strict ? x => Object.is(x, value) : x => x == value, limit)
}

export function fpArrayDeleteValue<T>(value: T, strict: boolean, limit?: number) {
    return (a: T[] | nil) => arrayDeleteValue(a, value, strict, limit)
}

/**
 * Filters the array to elements that pass the predicate.
 * If limit is provided, returned array will be at most that length.
 */
export function arraySelect<T>(array: T[] | nil, predicate: (v: T, i: number) => boolean, limit?: number): T[] {
    if(!array?.length) return []
    if(limit == null) {
        return array.filter((v, i) => predicate(v, i))
    }
    if(limit <= 0) return []
    let selected: T[] = []
    for(const [i, v] of array.entries()) {
        if(predicate(v, i)) {
            selected.push(v)
            if(selected.length >= limit) break
        }
    }
    return selected
}

export function fpArraySelect<T>(predicate: (v: T, i: number) => boolean, limit?: number) {
    return (a: T[] | nil) => arraySelect(a, predicate, limit)
}

/**
 * Removes elements that do *not* pass the predicate.
 * If limit is provided, at most that many elements will be deleted. i.e. new length will be >= array.length - limit.
 */
export function arrayReject<T>(array: T[] | nil, predicate: (v: T, i: number) => boolean, limit?: number): T[] {
    if(!array?.length) return []
    if(limit == null) {
        return array.filter((v, i) => !predicate(v, i))
    }
    if(limit <= 0) return array
    let selected: T[] = []
    let rejected = 0
    for(const [i, v] of array.entries()) {
        if(rejected < limit && predicate(v, i)) {
            ++rejected
        } else {
            selected.push(v)
        }
    }
    return selected
}

export function fpArrayReject<T>(predicate: (v: T, i: number) => boolean, limit?: number) {
    return (a: T[]) => arrayReject(a, predicate, limit)
}

export function arraySort<T>(array: T[] | nil, compareFn: (a: T, b: T) => number) {
    if(!array?.length) return []
    return [...array].sort(compareFn)
}

export function arraySortNumbers(array: number[] | nil, ascending = true) {
    if(!array?.length) return []
    return arraySort(array, ascending ? (a, b) => a - b : (a, b) => b - a)
}

interface CollatorOptions extends Intl.CollatorOptions {
    /**
     * A string with a BCP 47 language tag, or an array of such strings.
     */
    locales?: string | string[]
    /**
     * Sort in ascending order (alphabetically, A->Z).
     */
    ascending?: boolean
}

export function arraySortStrings(array: string[] | nil, options: CollatorOptions = {
    sensitivity: 'base',
    numeric: true,
    usage: 'sort',
    ascending: true,
}) {
    if(!array?.length) return []
    const {locales, ascending, ...opts} = options
    const collator = new Intl.Collator(locales, opts)
    const compare = ascending ? collator.compare : (a: string, b: string) => -collator.compare(a, b)
    return arraySort(array, compare)
}

/**
 * Replaces `count` elements starting at the given `index` with `replaceWith` elements.
 *
 * @param array Array to remove value from
 * @param index Index to remove
 * @param count
 * @param replaceWith
 * @returns Array with `value` removed
 */
export function arraySplice<T>(array: T[]|nil, index: number, count = 1, ...replaceWith: T[]): T[] {
    array ??= []
    return [
        ...array.slice(0, index),
        ...replaceWith,
        ...array.slice(index + count),
    ]
}

export function fpArraySplice<T>(index: number, count = 1, ...replaceWith: T[]) {
    return (a: T[]|nil) => arraySplice(a, index, count, ...replaceWith)
}

type ArrayPredicate<T> = (v: T, i: number) => boolean
type ArrayElementResolvable<T> = Resolvable<T,[T,number]>

export function arrayFindAndReplace<T>(array: T[], predicate: ArrayPredicate<T>, replaceWith: ArrayElementResolvable<T>): T[] {
    const idx = array.findIndex(predicate)
    if(idx < 0) return array
    return arraySplice(array, idx, 1, resolveValue(replaceWith,array[idx],idx))
}

export function fpArrayFindAndReplace<T>(predicate: ArrayPredicate<T>, replaceWith: ArrayElementResolvable<T>) {
    return (a: T[]|nil) => arrayFindAndReplace(a ?? [], predicate, replaceWith)
}
