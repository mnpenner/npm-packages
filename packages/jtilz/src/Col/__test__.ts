import {
    __skip__, filterMap, filterMapAsync, flatMap, groupBy, mapArray, reduceArray, toArray, toArrayStrict,
    toSet
} from './index';
import {isIterable} from '../Lang/is';


const numbers = [1, 2, 3, 4, 5];

function *gen() {
    yield 4;
    yield 5;
}

test(toArray.name, () => {
    expect(toArray(numbers)).toBe(numbers);
    expect(toArray(new Set(numbers))).toEqual(numbers);


    expect(toArray(gen())).toEqual([4,5]);
    expect(toArray("foo")).toEqual(['foo']);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray(null)).toEqual([]);

    expect(toArrayStrict("foo")).toEqual(['f','o','o']);
});

test(toSet.name, () => {
    const s = new Set([1,2,3]);
    expect(toSet(s)).toBe(s);
    expect(toSet([1,2,3])).toEqual(s);
    expect(toSet(gen())).toEqual(new Set([4,5]));
})


test(mapArray.name, () => {
    expect(mapArray(gen(), x=>x*2)).toEqual([8,10]);
})

test(filterMap.name, () => {
    expect(filterMap(numbers, x => x * 2)).toEqual([2, 4, 6, 8, 10]);
    expect(filterMap(numbers, x => {
        if(x % 2 === 0) {
            return __skip__;
        }
        return x * 2;
    })).toEqual([2, 6, 10]);
});

test(filterMapAsync.name, async () => {
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


test(flatMap.name, () => {
    expect(
        flatMap([1,2], x => [x,x])
    ).toEqual(
        [1,1,2,2]
    )

    expect(
        flatMap([1,2], x => x*2)
    ).toEqual(
        [2,4]
    )
});

test(reduceArray.name, () => {
    expect(
        reduceArray([0,1,2,3], (acc, val) => acc + val)
    ).toEqual(6);
    expect(
        reduceArray([0,1,2,3], (acc, val) => acc + val, 0)
    ).toEqual(6);
});

test(isIterable.name, () => {
    expect(isIterable([])).toBeTruthy();
    expect(isIterable(gen())).toBeTruthy();
    expect(isIterable('foo')).toBeTruthy();
    expect(isIterable(new Set())).toBeTruthy();
    expect(isIterable({})).toBeFalsy();
    expect(isIterable(true)).toBeFalsy();
    expect(isIterable(1)).toBeFalsy();
    expect(isIterable({[Symbol.iterator]: ()=>{}})).toBeTruthy();
})

test(groupBy.name, () => {
    const people = [
        {
            name: "Luke Skywalker",
            species: "Human",
        },
        {
            name: "C-3PO",
            species: "Droid",
        },
        {
            name: "R2-D2",
            species: "Droid",
        },
    ];

    expect(
        groupBy(people, p => p.species)
    ).toEqual(
        {
            Human: [
                {
                    name: "Luke Skywalker",
                    species: "Human",
                },
            ],
            Droid: [
                {
                    name: "C-3PO",
                    species: "Droid",
                },
                {
                    name: "R2-D2",
                    species: "Droid",
                },

            ]
        }
    )

    expect(
        groupBy(new Set([6.1, 4.2, 6.3]), Math.floor)
    ).toEqual(
        { '4': [4.2], '6': [6.1, 6.3] }
    )
});