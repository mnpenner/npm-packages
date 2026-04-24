import {fpSetAdd, fpSetCheck, fpSetRemove, setCheck, setIntersection, setSymmetricDifference, setUnion} from './set'


describe(fpSetCheck.name, () => {
    it('adds', () => {
        const set = new Set([1,2,3])
        const out = fpSetCheck(4,true)(set)
        expect(set).toStrictEqual(new Set([1,2,3]))
        expect(out).toStrictEqual(new Set([1,2,3,4]))
    })
    it('removes', () => {
        const set = new Set([1,2,3])
        const out = fpSetCheck(2,false)(set)
        expect(set).toStrictEqual(new Set([1,2,3]))
        expect(out).toStrictEqual(new Set([1,3]))
    })
})

describe(fpSetAdd.name, () => {
    it('adds multiple', () => {
        const set = new Set([1,2,3])
        const out = fpSetAdd(3,4,5)(set)
        expect(set).toStrictEqual(new Set([1,2,3]))
        expect(out).toStrictEqual(new Set([1,2,3,4,5]))
    })
})

describe(fpSetRemove.name, () => {
    it('removes multiple', () => {
        const set = new Set([1,2,3])
        const out = fpSetRemove(1,3,4)(set)
        expect(set).toStrictEqual(new Set([1,2,3]))
        expect(out).toStrictEqual(new Set([2]))
    })
})

describe(setUnion.name, () => {
    it('merges sets', () => {
        expect(setUnion([1,2,3],[3,4,5],[5,6,7])).toStrictEqual(new Set([1,2,3,4,5,6,7]))
    })
})

describe(setIntersection.name, () => {
    it('intersects sets', () => {
        expect(setIntersection(new Set([1,2,3]), new Set([2,3,4]))).toStrictEqual(new Set([2,3]))
    })
})

describe(setSymmetricDifference.name, () => {
    it('diffs sets', () => {
        expect(setSymmetricDifference(new Set([1,2,3]), new Set([2,3,4]))).toStrictEqual(new Set([1,4]))
    })
})
