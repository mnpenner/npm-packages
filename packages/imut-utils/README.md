# imut-utils

Immutability helper for React.

## Installation

```sh
bun add @mpen/imut-utils
# or
yarn add @mpen/imut-utils
# or
npm install @mpen/imut-utils
```

## Links

- Docs: https://mnpenner.github.io/npm-packages/imut-utils/
- Repo: https://github.com/mnpenner/npm-packages/tree/main/packages/imut-utils
- Issues: https://github.com/mnpenner/npm-packages/issues

## Styles

This library provides two styles of utilities:

1. **Imperative (Default)**: Functions that take the data as the first argument.
   ```ts
   import { arrayPush } from '@mpen/imut-utils'
   const next = arrayPush(prev, 1, 2, 3)
   ```
2. **Functional (`/fp`)**: Curried, data-last functions designed for functional pipelines and React's `setState`.
   ```ts
   import { arrayPush } from '@mpen/imut-utils/fp'
   setState(arrayPush(1, 2, 3))
   ```

## Quick Start

This library is designed to be paired with React, but has no such dependency. Here's an example:

```ts
import { shallowMerge, mapSet } from '@mpen/imut-utils/fp'

function App(props: AppProps) {
  const [state, setState] = useState<Map<string, SomeState>>(() => new Map())

  const doSomething = useCallback(async () => {
    const key = uniqId()

    // `mapSet` returns a function which takes in the previous state, clones it and sets the given key to the given value.
    setState(
      mapSet<string, SomeState>(key, {
        loading: true,
        coolFact: 'The lifespan of a single taste bud is about 10 days.',
      }),
    )

    const result = await fetchSomething()

    // ...the value for that key can also be a function. If so, the function will be called with the current value for that key.
    // Here, we chain that together with `shallowMerge` which again returns a function expecting the previous state and merges in the given state.
    setState(
      mapSet<string, SomeState>(
        key,
        shallowMerge({
          result,
          loading: false,
        }),
      ),
    )

    // `state` will be Map([[key,{coolFact: "...", result: {...}, loading: false}]])
    // Notice how we didn't have to read the map, clone it, pull out the current key and spread it into the new object.
  }, [])
}
```

Or here's another fun one:

```ts
import { mapSet } from '@mpen/imut-utils/fp'
import { arrayInsertSorted } from '@mpen/imut-utils/fp'

const [timings, setTimings] = useState<Map<string, number[]>>(() => new Map())
// ...
const startTime = Date.now()
await doSomethingThatTakesAwhile()
setTimings(mapSet(timingKey, arrayInsertSorted(Date.now() - startTime)))
```

Now you have a Map full of _sorted_ arrays. And you didn't need to initialize the map either; most of the functions will create an empty collection if the current state is `undefined` or `null`.

## Why?

There are a lot of other immutable libs for React out there. Why use this one?

### Simplicity

I'm not a fan of libs that use Proxies under the hood to track what mutations you've performed, they sometimes interfere when `this` is expected to be of a certain type. Why do you need [an escape hatch](https://immerjs.github.io/immer/current/) to "get the current value for debugging purposes"? You already have it -- the callback from React's `useState` is _always_ current, use it! Why do you need to [opt-in](https://i.imgur.com/zoWDuSa.png) to use Maps and Sets? What is this "artificial immutability"? There's no magic in imut-utils, just plain old objects. If you want to accidentally mutate it, it's your foot, not mine.

[immutability-helper](https://github.com/kolodny/immutability-helper) is pretty good, but it's a _little_ harder to extend, and you have to be comfortable with some fancy syntax. It also makes me slightly uncomfortable that there could be a key collision if I ever use an object with a property called `$push`.

Want to extend this lib? Just add a new function to your project, there's nothing to integrate. Most of the functions here are [just a few lines](https://github.com/mnpenner/npm-packages/blob/main/packages/imut-utils/src/imp/array.ts), the only benefit here is that they have tests that you now don't have to write.

## How big is it?

[1.4 kB minified+gzipped](https://bundlephobia.com/package/@mpen/imut-utils), but it's tree-shakeable; the output is ES modules. You shouldn't pay for what you don't use when bundled.

## Dependencies?

None. That's a feature.

## Is it stable?

No. You should pin against a _minor_ or _patch_ version until this reaches 1.0. I will try to make API breaks _minor_ bumps (until 1.0, then _majors_ are breaks, per [semver](https://semver.org/#spec-item-4)). Note that `^` does exactly this, so you probably don't have to do anything.

## Naming

The `/fp` entry point stands for "functional programming". These functions are curried and data-last, which is what React's `SetStateAction<S>` (returned by `useState`) expects.

## Contributions

[Open a ticket](https://github.com/mnpenner/npm-packages/issues) and we'll talk.

## License

MIT
