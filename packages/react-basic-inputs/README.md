# @mpen/react-basic-inputs

Thin wrappers around native input elements to make them behave better.

<a href="https://pkg-size.dev/@mpen/react-basic-inputs"><img src="https://pkg-size.dev/badge/bundle/12662" title="Bundle size for @mpen/react-basic-inputs"></a>

## Installation

```sh
bun add @mpen/react-basic-inputs
# or
yarn add @mpen/react-basic-inputs
# or
npm install @mpen/react-basic-inputs
```

## Links

- Docs: https://mnpenner.github.io/npm-packages/react-basic-inputs/
- Npm: https://www.npmjs.com/package/@mpen/react-basic-inputs
  - https://www.npmjs.com/package/@mpen/react-basic-inputs?activeTab=code
- Npmx: https://npmx.dev/package/@mpen/react-basic-inputs
- Yarn: https://yarnpkg.com/package/@mpen/react-basic-inputs
- pkg-size: https://pkg-size.dev/@mpen%2Freact-basic-inputs
- Bundlephobia: https://bundlephobia.com/package/@mpen/react-basic-inputs
- Unpkg: https://unpkg.com/@mpen/react-basic-inputs/dist/react-basic-inputs.js
- jsDelivr: https://cdn.jsdelivr.net/npm/@mpen/react-basic-inputs/dist/react-basic-inputs.js

## Components

### Select

Like `<select>` but takes an `options` prop instead of `children`.

- The values are typed; they can be anything, not just `string`
- Duplicate values are OK. e.g. if you want to put "United States" at the top of your country list and then again in
  alphabetical order, it will just work
- Each `<option>` will automatically be assigned a unique React `key`
- If the current `value` cannot be found in the list of `options` it will be appended to the end
  - If you want to override this behavior, set `invalidValueOption`
- `placeholder` prop
