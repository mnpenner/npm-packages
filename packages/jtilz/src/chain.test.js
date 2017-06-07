import chain, {tap, thru} from './chain';
import {flatten} from './Array';

test('tap', () => {
    expect(
        [1,2,3]::tap(a => a.pop()).reverse()
    ).toEqual(
        [2,1]
    );
});

test('thru', () => {
    expect(
        '  abc  '.trim()::thru(v => [v])
    ).toEqual(
        ['abc']
    );
});

test('chain', () => {
    const f = chain(flatten);
    
    expect(
        [[1,2,3],[4,5,6]]::f()
    ).toEqual(
        [1,2,3,4,5,6]
    )
});