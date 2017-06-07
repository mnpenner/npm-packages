

import {divQR,wholeFrac} from './Math';

test(divQR.name, () => {
    expect(divQR(7,3)).toEqual([2,1]);
    expect(divQR(7,2)).toEqual([3,1]);
    expect(divQR(7,4)).toEqual([1,3]);
    expect(divQR(7,7)).toEqual([1,0]);
    expect(divQR(7,1)).toEqual([7,0]);
    expect(divQR(4,3)).toEqual([1,1]);
    let [q,r] = divQR(4.2,2);
    expect(q).toEqual(2);
    expect(r).toBeCloseTo(0.2,15);
})

describe(wholeFrac.name, () => {
    it('should work with positive floats', () => {
        let [w,f] = wholeFrac(3.14);
        expect(w).toEqual(3);
        expect(f).toBeCloseTo(0.14,15);
    });
    it('should work with negative floats', () => {
        let [w,f] = wholeFrac(-2.718);
        expect(w).toEqual(-2);
        expect(f).toBeCloseTo(-0.718,15);
    });
})