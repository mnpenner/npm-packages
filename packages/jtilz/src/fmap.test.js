import {__skip__} from './Collection';
import fmap from './fmap';

const numbers = [1, 2, 3, 4, 5];

test('fmap', () => {
    expect(numbers::fmap(x => x * 2)).toEqual([2, 4, 6, 8, 10]);
    expect(numbers::fmap(x => {
        if(x % 2 === 0) {
            return __skip__;
        }
        return x * 2;
    })).toEqual([2, 6, 10]);
});