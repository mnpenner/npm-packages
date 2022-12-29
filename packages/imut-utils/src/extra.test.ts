import {fpArrayPush} from './array'
import {binarySearch} from './extra'


describe(binarySearch.name, () => {
    it('finds matches', () => {
        const arr = [1,3,5,7,9,11]
        expect(binarySearch(arr,5)).toStrictEqual(2)
        expect(binarySearch(arr,1)).toStrictEqual(0)
        expect(binarySearch(arr,11)).toStrictEqual(5)
    })
    it('gives insert position', () => {
        const arr = [1,3,5,7,9,11]
        expect(binarySearch(arr,2)).toStrictEqual(~1)
        expect(binarySearch(arr,0)).toStrictEqual(~0)
        expect(binarySearch(arr,99)).toStrictEqual(~6)
    })
})
