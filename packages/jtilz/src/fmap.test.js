import {__skip__, filterMap, filterMapAsync} from './fmap';


const numbers = [1, 2, 3, 4, 5];

test('filterMap', () => {
    expect(filterMap(numbers, x => x * 2)).toEqual([2, 4, 6, 8, 10]);
    expect(filterMap(numbers, x => {
        if(x % 2 === 0) {
            return __skip__;
        }
        return x * 2;
    })).toEqual([2, 6, 10]);
});

test('filterMapAsync', async () => {
    await expect(filterMapAsync(numbers, x => x * 2)).resolves.toEqual([2, 4, 6, 8, 10]);
    await expect(filterMapAsync(numbers, x => new Promise((resolve, reject) => {
        if(x % 2 === 0) {
            process.nextTick(() => resolve(__skip__));
        } else {
            resolve(x * 2);
        }
    }))).resolves.toEqual([2, 6, 10]);
    await expect(filterMapAsync(numbers, x => new Promise((resolve, reject) => {
        if(x % 2 === 0) {
            process.nextTick(reject);
        } else {
            resolve(x * 2);
        }
    }))).resolves.toEqual([2, 6, 10]);
});