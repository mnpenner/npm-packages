# imut-utils

## Installation

```sh
yarn add @mnpenner/imut-utils
# or
npm install @mnpenner/imut-utils
```

## Usage

This library is designed to be paired with React, but has no such dependency. Here's an example lightly modified from a project I'm working on:

```ts
function App(props: AppProps) {
    const [state, setState] = useState<Map<string, SomeState>>(() => new Map)
    
    const doSomething = useCallback(async () => {
        const key = uniqId()
        
        // `fpMapSet` returns a function which takes in the previous state, clones it and sets the given key to the given value.
        setState(fpMapSet<string, SomeState>(key, {
            loading: true,
            coolFact: 'The lifespan of a single taste bud is about 10 days.',
        }))
        
        const result = await fetchSomething()
        
        // ...the value for that key can also be a function. If so, the function will be called with the current value for that key. Here, we chain that together with `fpShallowMerge` which again returns a function expecting the previous state and merges in the given state.
        setState(fpMapSet<string, SomeState>(key, fpShallowMerge({
            result,
            loading: false,
        })))
        
        // `state` will be Map([[key,{coolFact: "...", result: {...}, loading: false}]])
        // Notice how we didn't have to read the map, clone it, pull out the current key and spread it into the new object. The deeper your objects get, the more typing you save because all the functions can be chained together.
    }, [])
}
```

Or here's another fun one:

```ts
const [timings, setTimings] = useState<Map<string, number[]>>(() => new Map)
// ...
const startTime = Date.now()
await doSomethingThatTakesAwhile()
setTimings(fpMapSet(timingKey, fpArrayInsertSorted(Date.now() - startTime)))
```

Now you have a Map full of *sorted* arrays. And you didn't need to initialize the map either, most of the array functions will create an empty array if the current state is `undefined`.

## Why?

There are a lot of other immutable libs for React out there. Why use this one?

Simplicity. I'm not a fan of libs that use Proxies under the hood to track what mutations you've performed, they sometimes interfere where `this` is expected to be of a certain type, and they add unnecessary overhead. [immutability-helper](https://github.com/kolodny/immutability-helper) is pretty good, but it's a *little* harder extend, and you have to be comfortable with some fancy syntax. It also makes me slightly uncomfortable that there could be a key collision if I ever use an object with a property called `$push`.

Want to extend this lib? Just add a new function to your project, there's nothing to integrate. Most of the functions here are [just a few lines](https://github.com/mnpenner/imut-utils/blob/a783281d4e1e8fc5ea96e22f53861a4f4cae9d53/src/array.ts#L12), the only benefit is that they have tests that you now don't have to write.


## How big is it?

1.2 kB minified+gzipped [apparently](https://bundlephobia.com/package/@mnpenner/imut-utils@0.1.17). But it's tree-shakeable; the output is ES modules. You shouldn't pay for what you don't use if you use a bundler.

## Dependencies?

None. That's a feature.

## Is it stable?

[No](https://semver.org/#spec-item-4). You should pin against a minor a patch version until this reaches 1.x. I will try to make API breaks minor bumps (until 1.0, then majors are breaks, per semver).

Or just copy the functions you like out of [the src](https://github.com/mnpenner/imut-utils/tree/default/src).

## Docs?

Read [the d.ts files](https://www.npmjs.com/package/@mnpenner/imut-utils?activeTab=explore).

Where you see `Resolvable` in the type definitions basically just means I will call this function on it:

```js
export function resolveValue(val, ...args) {
    return typeof val === 'function' ? val(...args) : val;
}
```

Where `args` is the current value and key so that you can add to it, concat it, or chain it with another function from this lib (or another lib, no judgement! -- but do tell me, so I can add it).

`fp` stands for "functional programming" or something. I couldn't come up with a good name for "function that returns a function that expects the previous state as input" so I just copied the naming from [lodash/fp](https://github.com/lodash/lodash/wiki/FP-Guide). It's basically what React's `SetStateAction<S>` accepts.

## License

MIT
