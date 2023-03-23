import {
    fpArrayDeleteIndex,
    fpArraySelect,
    fpArrayPush,
    fpArrayReject,
    fpArrayDeleteOneValue,
    fpArrayUnshift,
    arraySortNumbers,
    arraySortStrings,
    fpArrayInsert,
    arrayInsertSorted,
    fpArrayInsertSorted,
    fpArrayPop, fpArrayDeleteValue, fpArrayFindAndReplace, fpArraySplice
} from './array'


test(fpArrayPush.name, () => {
    const arr = [3, 1, 2, 7, 4, 6, 5]
    const out = fpArrayPush(1, 5, 3)(arr)
    expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
    expect(out).toStrictEqual([3, 1, 2, 7, 4, 6, 5, 1, 5, 3])
})

describe(fpArrayPop.name, () => {
    it('takes 0 args', () => {
        expect(fpArrayPop()([1, 2, 3])).toStrictEqual([1, 2])
    })
    it('throws on bad input', () => {
        expect(() => fpArrayPop(-1)([1, 2, 3])).toThrow()
        expect(() => fpArrayPop(3.14)([1, 2, 3])).toThrow()
    })
    it('pops multiple', () => {
        expect(fpArrayPop(0)([1, 2, 3])).toStrictEqual([1, 2, 3])
        expect(fpArrayPop(1)([1, 2, 3])).toStrictEqual([1, 2])
        expect(fpArrayPop(2)([1, 2, 3])).toStrictEqual([1])
        expect(fpArrayPop(3)([1, 2, 3])).toStrictEqual([])
        expect(fpArrayPop(4)([1, 2, 3])).toStrictEqual([])
    })
    it('handles nil', () => {
        expect(fpArrayPop()([])).toStrictEqual([])
        expect(fpArrayPop()(null)).toStrictEqual([])
        expect(fpArrayPop()(undefined)).toStrictEqual([])
    })
})


test(fpArrayUnshift.name, () => {
    const arr = [3, 1, 2, 7, 4, 6, 5]
    const out = fpArrayUnshift(1, 5, 3)(arr)
    expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
    expect(out).toStrictEqual([1, 5, 3, 3, 1, 2, 7, 4, 6, 5])
})

test(fpArrayInsert.name, () => {
    expect(fpArrayInsert(0, 99)([1, 3, 5])).toStrictEqual([99, 1, 3, 5])
    expect(fpArrayInsert(1, 99)([1, 3, 5])).toStrictEqual([1, 99, 3, 5])
    expect(fpArrayInsert(1, 99)([1, 3, 5])).toStrictEqual([1, 99, 3, 5])
    expect(fpArrayInsert(9, 99)([1, 3, 5])).toStrictEqual([1, 3, 5, 99])
    expect(fpArrayInsert(2, 77, 88, 99)([1, 3, 5])).toStrictEqual([1, 3, 77, 88, 99, 5])
    expect(fpArrayInsert(2)([1, 3, 5])).toStrictEqual([1, 3, 5])
})

test(fpArrayInsertSorted.name, () => {
    expect(fpArrayInsertSorted(6, 2, 4)([1, 3, 5, 7])).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
    expect(fpArrayInsertSorted(9, -9)([1, 3, 5, 7])).toStrictEqual([-9, 1, 3, 5, 7, 9])
    expect(fpArrayInsertSorted(3, 5)([1, 3, 5, 7])).toStrictEqual([1, 3, 3, 5, 5, 7])
})


test(fpArrayDeleteIndex.name, () => {
    const arr = [3, 1, 2, 7, 4, 6, 5]
    const out = fpArrayDeleteIndex(1, 5, 3)(arr)
    expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
    expect(out).toStrictEqual([3, 2, 4, 5])
})

describe(fpArraySelect.name, () => {
    it('basic', () => {
        const arr = [3, 1, 2, 7, 4, 6, 5]
        const out = fpArraySelect<number>((v, i) => v > 5 || i === 0)(arr)
        expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
        expect(out).toStrictEqual([3, 7, 6])
    })
    it('more', () => {
        expect(fpArraySelect<number>(n => n % 2 === 0)([1, 2, 3, 4, 5, 6])).toEqual([2, 4, 6])
        expect(fpArraySelect<number>(n => n % 2 === 0, 2)([1, 2, 3, 4, 5, 6])).toEqual([2, 4])
        expect(fpArraySelect<number>(n => n % 2 === 0, 0)([1, 2, 3, 4, 5, 6])).toEqual([])
    })
})


describe(fpArrayReject.name, () => {
    it('basic', () => {
        const arr = [3, 1, 2, 7, 4, 6, 5]
        const out = fpArrayReject<number>((v, i) => v > 5 || i === 0)(arr)
        expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
        expect(out).toStrictEqual([1, 2, 4, 5])
    })
    it('more', () => {
        expect(fpArrayReject<number>(n => n % 2 === 0)([1, 2, 3, 4, 5, 6])).toEqual([1, 3, 5])
        expect(fpArrayReject<number>(n => n % 2 === 0, 2)([1, 2, 3, 4, 5, 6])).toEqual([1, 3, 5, 6])
        expect(fpArrayReject<number>(n => n % 2 === 0, 0)([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4, 5, 6])
    })
})

test(fpArrayDeleteValue.name, () => {
    expect(fpArrayDeleteValue<number>(2, true)([1, 2, 1, 2])).toEqual([1, 1])
    expect(fpArrayDeleteValue<number>(2, false)([1, 2, 1, 2])).toEqual([1, 1])
    expect(fpArrayDeleteValue<number | string>('2', false)([1, 2, 1, 2])).toEqual([1, 1])
    expect(fpArrayDeleteValue<number>(2, true, 1)([1, 2, 1, 2])).toEqual([1, 1, 2])
    expect(fpArrayDeleteValue<number>(1, false, 2)([1, 2, 1, 2, 1, 2])).toEqual([2, 2, 1, 2])
})


describe(fpArrayDeleteOneValue.name, () => {
    it('deletes one value', () => {
        const arr = [1, 9, 2, 9, 3]
        const out = fpArrayDeleteOneValue<number>(9, false)(arr)
        expect(arr).toStrictEqual([1, 9, 2, 9, 3])
        expect(out).toStrictEqual([1, 2, 9, 3])
    })
    it('performs loose comparison', () => {
        const arr = [1, '2', 2, '3']
        const out = fpArrayDeleteOneValue<string | number>(2, false)(arr)
        expect(arr).toStrictEqual([1, '2', 2, '3'])
        expect(out).toStrictEqual([1, 2, '3'])
    })
    it('performs strict comparison', () => {
        const arr = [1, '2', 2, '3']
        const out = fpArrayDeleteOneValue<string | number>(2, true)(arr)
        expect(arr).toStrictEqual([1, '2', 2, '3'])
        expect(out).toStrictEqual([1, '2', '3'])
    })
    it('no match', () => {
        const arr = [1, 9, 2, 9, 3]
        const out = fpArrayDeleteOneValue<number>(10, false)(arr)
        expect(arr).toStrictEqual([1, 9, 2, 9, 3])
        expect(out).toBe(arr)
    })
})


describe(arraySortNumbers.name, () => {
    it('sorts ascending', () => {
        const arr = [3, 1, 2, 7, 4, 6, 5]
        const out = arraySortNumbers(arr)
        expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
        expect(out).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
    })
    it('sorts descending', () => {
        const arr = [3, 1, 2, 7, 4, 6, 5]
        const out = arraySortNumbers(arr, false)
        expect(arr).toStrictEqual([3, 1, 2, 7, 4, 6, 5])
        expect(out).toStrictEqual([7, 6, 5, 4, 3, 2, 1])
    })
})

describe(arraySortStrings.name, () => {
    it('sorts alphabetically', () => {
        const arr = ['alpha', 'charlie', 'beta']
        const out = arraySortStrings(arr)
        expect(arr).toStrictEqual(['alpha', 'charlie', 'beta'])
        expect(out).toStrictEqual(['alpha', 'beta', 'charlie'])
    })
    it('sorts case-insensitive', () => {
        expect(arraySortStrings(['AA', 'ab', 'aa']))
            .toStrictEqual(['AA', 'aa', 'ab'])
    })
    it('sorts numbers', () => {
        expect(arraySortStrings(['a2', 'a10', 'a1']))
            .toStrictEqual(['a1', 'a2', 'a10'])
    })
    it('sorts descending', () => {
        expect(arraySortStrings(['c', 'ab', 'b', 'aa'], {ascending: false}))
            .toStrictEqual(['c', 'b', 'ab', 'aa'])
    })
})

test(fpArrayFindAndReplace.name, () => {
    expect(fpArrayFindAndReplace(x => x === 5, 3)([1, 2, 5, 4])).toEqual([1, 2, 3, 4])
    expect(fpArrayFindAndReplace(x => x === 6, 3)([1, 2, 5, 4])).toEqual([1, 2, 5, 4])
})

test(fpArraySplice.name, () => {
    expect(fpArraySplice(2)([1, 2, 3, 4])).toEqual([1, 2, 4])
    expect(fpArraySplice(2, 2)([1, 2, 3, 4])).toEqual([1, 2])
    expect(fpArraySplice(2, 1, 7, 8, 9)([1, 2, 3, 4])).toEqual([1, 2, 7, 8, 9, 4])
    expect(fpArraySplice(1, 0, 9)([1, 2, 3, 4])).toEqual([1, 9, 2, 3, 4])
    expect(fpArraySplice(0, 0, 9)([1, 2, 3, 4])).toEqual([9, 1, 2, 3, 4])
    expect(fpArraySplice(9, 0, 9)([1, 2, 3, 4])).toEqual([1, 2, 3, 4, 9])
})
