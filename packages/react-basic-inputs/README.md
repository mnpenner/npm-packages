# react-basic-inputs

Thin wrappers around native input elements to make them behave better.

## Installation

```sh
yarn add @mnpenner/react-basic-inputs
# or
npm install @mnpenner/react-basic-inputs
```

## Links

- Docs: https://mnpenner.github.io/react-basic-inputs
- Repo: https://github.com/mnpenner/react-basic-inputs
  - Code: https://github.com/mnpenner/react-basic-inputs/tree/default/src
  - Issues: https://github.com/mnpenner/react-basic-inputs/issues
- Npm: https://www.npmjs.com/package/@mnpenner/react-basic-inputs
- Yarn: https://yarnpkg.com/package/@mnpenner/react-basic-inputs
- Bundlephobia: https://bundlephobia.com/package/@mnpenner/react-basic-inputs
- Unpkg: https://unpkg.com/@mnpenner/react-basic-inputs/dist/bundle.mjs
- jsDelivr: https://cdn.jsdelivr.net/npm/@mnpenner/react-basic-inputs/dist/bundle.mjs

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
