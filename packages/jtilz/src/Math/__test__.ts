import {divQR,wholeFrac} from './index';

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