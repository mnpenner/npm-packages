/**
 * Appends elements onto the end of the array.
 */
export function arrayPush<T>(array: T[], ...values: T[]): T[] {
    return [...array, ...values]
}
export function fpArrayPush<T>(...values: T[]): FP<T[]> {
    return (a:T[]) => arrayPush(a, ...values)
}

/**
 * Prepends elements onto the end of the array.
 */
export function arrayUnshift<T>(array: T[], ...values: T[]): T[] {
    return [...values, ...array]
}
export function fpArrayUnshift<T>(...values: T[]): FP<T[]> {
    return (a:T[]) => arrayUnshift(a, ...values)
}

/**
 * Deletes elements from an array by index.
 */
export function arrayDeleteIndex<T>(array: T[], ...indices: number[]): T[] {
    indices.sort((a,b) => b-a)
    const ret = [...array]
    for(const i of indices) {
        ret.splice(i, 1)
    }
    return ret
}
export function fpArrayDeleteIndex<T>(...indices: number[]): FP<T[]> {
    return (a:T[]) => arrayDeleteIndex(a, ...indices)
}

function fpLooseEq<T>(value: any) {
    return (other: any) => other == value
}

function fpStrictEq<T>(value: any) {
    return (other: any) => Object.is(value, other)
}

/**
 * Deletes up to one element from an array, searching by value.
 */
export function arrayDeleteOneValue<T>(array: T[], value: T, strict: boolean): T[] {
    const idx = array.findIndex((strict ? fpStrictEq : fpLooseEq)(value))
    return idx < 0 ? array : arrayDeleteIndex(array, idx)
}
export function fpArrayDeleteOneValue<T>(value: T, strict: boolean): FP<T[]> {
    return (a:T[]) => arrayDeleteOneValue(a, value, strict)
}

/**
 * Filters the array to elements that pass the predicate.
 */
export function arraySelect<T>(array: T[], predicate: (v: T, i:number)=>boolean): T[] {
    return array.filter((v,i) => predicate(v,i))
}
export function fpArraySelect<T>(predicate: (v: T, i:number)=>boolean): FP<T[]> {
    return (a:T[]) => arraySelect(a, predicate)
}

/**
 * Removes elements that do *not* pass the predicate.
 */
export function arrayReject<T>(array: T[], predicate: (v: T, i:number)=>boolean): T[] {
    return array.filter((v,i) => !predicate(v,i))
}
export function fpArrayReject<T>(predicate: (v: T, i:number)=>boolean): FP<T[]> {
    return (a:T[]) => arrayReject(a, predicate)
}


export function arraySort<T>(array: T[], compareFn: (a:T,b:T) => number) {
    return [...array].sort(compareFn)
}
export function arraySortNumbersAsc(array: number[]) {
    return arraySort(array, (a,b) => a - b)
}
export function arraySortNumbersDesc(array: number[]) {
    return arraySort(array, (a,b) => b - a)
}

export function arraySortStringsAsc(array: string[], locales?: string, options?: Intl.CollatorOptions) {
    return arraySort(array, new Intl.Collator(locales, options).compare)
}
