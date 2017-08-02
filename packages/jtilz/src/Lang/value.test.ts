import {isEmpty} from './value';

test(isEmpty.name, () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(Object.create(null))).toBe(true);
    expect(isEmpty(new Date(''))).toBe(true);
    expect(isEmpty(new Map)).toBe(true);
    expect(isEmpty(new Set)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty(NaN)).toBe(true);
    expect(isEmpty(null)).toBe(true);
    
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty('x')).toBe(false);
    expect(isEmpty([0])).toBe(false);
    expect(isEmpty(new Date)).toBe(false);
    expect(isEmpty({0:0})).toBe(false);
    expect(isEmpty(new Map([['',0]]))).toBe(false);
    expect(isEmpty(new Set([0]))).toBe(false);
    expect(isEmpty(true)).toBe(false);
    expect(isEmpty(false)).toBe(false); // hmm...
})
