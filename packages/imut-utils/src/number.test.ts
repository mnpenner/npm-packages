import {add, div, fpAdd, fpDiv, fpMult, fpSub, mult, sub} from './number'


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

test(sub.name, () => {
    expect(sub(1,2)).toBe(-1)
    expect(sub(null,2)).toBe(-2)
    expect(sub(undefined,3)).toBe(-3)
})

test(fpSub.name, () => {
    expect(fpSub(2)(1)).toBe(-1)
    expect(fpSub(2)(null)).toBe(-2)
    expect(fpSub(3)(undefined)).toBe(-3)
})

test(mult.name, () => {
    expect(mult(2,6)).toBe(12)
    expect(mult(undefined,2)).toBe(0)
})

test(fpMult.name, () => {
    expect(fpMult(2)(6)).toBe(12)
    expect(fpMult(2)(undefined)).toBe(0)
})

test(div.name, () => {
    expect(div(6,2)).toBe(3)
    expect(div(null,2)).toBe(0)
})

test(fpDiv.name, () => {
    expect(fpDiv(2)(6)).toBe(3)
    expect(fpDiv(2)(undefined)).toBe(0)
})
