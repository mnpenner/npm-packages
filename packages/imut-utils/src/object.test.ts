import {fpShallowMerge} from './object'

test(fpShallowMerge.name, () => {
    expect(fpShallowMerge<Record<string,number>>({b:2,c:9},{c:3,d:4})({a:1,d:9})).toEqual({
        a:1,
        b:2,
        c:3,
        d:4,
    })
})
