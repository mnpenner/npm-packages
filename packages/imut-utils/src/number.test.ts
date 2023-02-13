import {add, fpAdd, fpDiv, fpMult} from './number'


test(add.name, () => {
    expect(add(1,2)).toBe(3)
    expect(add(null,2)).toBe(2)
    expect(add(undefined,3)).toBe(3)
})

test(fpAdd.name, () => {
    expect(fpAdd(2)(1)).toBe(3)
    expect(fpAdd(2)(null)).toBe(2)
    expect(fpAdd(3)(undefined)).toBe(3)
})

test(fpMult.name, () => {
    expect(fpMult(2)(6)).toBe(12)
    expect(fpMult(2)(undefined)).toBe(0)
})

test(fpDiv.name, () => {
    expect(fpDiv(2)(6)).toBe(3)
    expect(fpDiv(2)(undefined)).toBe(0)
})
