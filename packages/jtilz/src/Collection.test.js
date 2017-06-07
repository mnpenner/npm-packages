import {__skip__, filterMap, filterMapAsync, flatMap, groupBy, mapArray, toArray, toSet} from './Collection';


const numbers = [1, 2, 3, 4, 5];

function *gen() {
    yield 4;
    yield 5;
}

test('toArray', () => {
    expect(toArray(numbers)).toBe(numbers);
    expect(toArray(new Set(numbers))).toEqual(numbers);
    

    expect(toArray(gen())).toEqual([4,5]);
    expect(toArray("foo")).toEqual(['foo']);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray(null)).toEqual([]);
    
    expect(toArray("foo",true)).toEqual(['f','o','o']);
});

test('toSet', () => {
    const s = new Set([1,2,3]);
    expect(toSet(s)).toBe(s);
    expect(toSet([1,2,3])).toEqual(s);
    expect(toSet(gen())).toEqual(new Set([4,5]));
})

test('mapArray', () => {
    expect(mapArray(gen(), x=>x*2)).toEqual([8,10]);
})

test('filterMap', () => {
    expect(filterMap(numbers, x => x * 2)).toEqual([2, 4, 6, 8, 10]);
    expect(filterMap(numbers, x => {
        if(x % 2 === 0) {
            return __skip__;
        }
        return x * 2;
    })).toEqual([2, 6, 10]);
});

test('groupBy', () => {
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

test('flatMap', () => {
    expect(
        flatMap([1,2], x => [x,x])
    ).toEqual(
        [1,1,2,2]
    )
});
