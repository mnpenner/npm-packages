# imut-utils

## Installation

```sh
yarn add @mnpenner/imut-utils
# or
npm install @mnpenner/imut-utils
```

## Links

- Docs: https://mnpenner.github.io/imut-utils
- Repo: https://github.com/mnpenner/imut-utils
  - Code: https://github.com/mnpenner/imut-utils/tree/default/src
  - Issues: https://github.com/mnpenner/imut-utils/issues
- Npm: https://www.npmjs.com/package/@mnpenner/imut-utils
- Yarn: https://yarnpkg.com/package/@mnpenner/imut-utils
- Bundlephobia: https://bundlephobia.com/package/@mnpenner/imut-utils
- Unpkg: https://unpkg.com/@mnpenner/imut-utils
- jsDelivr: https://cdn.jsdelivr.net/npm/@mnpenner/imut-utils

## Quick Start

This library is designed to be paired with React, but has no such dependency. Here's an example lightly modified from a project I'm working on:

```ts
import {fpShallowMerge, fpMapSet} from '@mnpenner/imut-utils'

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

Simplicity. 

I'm not a fan of libs that use Proxies under the hood to track what mutations you've performed, they sometimes interfere when `this` is expected to be of a certain type. Why do you need [an escape hatch](https://immerjs.github.io/immer/current/) to "get the current value for debugging purposes"? You already have it -- the callback from React's `useState` is *always* current, use it! Why do you need to [opt-in](https://i.imgur.com/zoWDuSa.png) to use Maps and Sets? What is this "artificial immutability"? There's no magic in imut-utils, just plain old objects. If you want to accidentally mutate it, it's your foot, not mine.


[immutability-helper](https://github.com/kolodny/immutability-helper) is pretty good, but it's a *little* harder extend, and you have to be comfortable with some fancy syntax. It also makes me slightly uncomfortable that there could be a key collision if I ever use an object with a property called `$push`.

Want to extend this lib? Just add a new function to your project, there's nothing to integrate. Most of the functions here are [just a few lines](https://github.com/mnpenner/imut-utils/blob/a783281d4e1e8fc5ea96e22f53861a4f4cae9d53/src/array.ts#L12), the only benefit here is that they have tests that you now don't have to write.


## How big is it?

[1.4 kB minified+gzipped](https://bundlephobia.com/package/@mnpenner/imut-utils@0.1.23), but it's tree-shakeable; the output is ES modules. You shouldn't pay for what you don't use when bundled.

## Dependencies?

None. That's a feature.

## Is it stable?

No. You should pin against a *minor* or *patch* version until this reaches 1.0. I will try to make API breaks *minor* bumps (until 1.0, then *majors* are breaks, per [semver](https://semver.org/#spec-item-4)). Note that `^` does exactly this, so you probably don't have to do anything.

Or just copy the functions you like out of [the src](https://github.com/mnpenner/imut-utils/tree/default/src). If you prefer JS and don't want to build this package yourself, just copy from [Unpkg](https://unpkg.com/@mnpenner/imut-utils).

## Naming

`fp` stands for "functional programming" or something. I couldn't come up with a good name for "function that returns a function that expects the previous state as input" so I just copied the naming from [lodash/fp](https://github.com/lodash/lodash/wiki/FP-Guide). It's basically what React's `SetStateAction<S>` (returned by `useState`) accepts.

## Contributions

[Open a ticket](https://github.com/mnpenner/imut-utils/issues) and we'll talk.

## License

MIT
