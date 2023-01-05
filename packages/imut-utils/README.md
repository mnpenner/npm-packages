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

Where you see `Resolvable` in the type definitions basically just means I will call this function on it:

```js
export function resolveValue(val, ...args) {
    return typeof val === 'function' ? val(...args) : val;
}
```

Where `args` is the current value and key so that you can add to it, concat it, or chain it with another function from this lib (or another lib, no judgement! -- but do tell me, so I can add it).
