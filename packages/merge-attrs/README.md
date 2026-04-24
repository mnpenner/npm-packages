# merge-attrs

Merge HTML attributes (for React).

- `undefined` values will not overwrite the current value
- `className` will be merged with [@mpen/classcat](https://www.npmjs.com/package/@mpen/classcat).
- `style` performs a shallow merge via `Object.assign`.
- Event handlers (attributes beginning with "on") will be combined into a single function that executes all the handlers.
    - The same goes for [`ref`](https://facebook.github.io/react/docs/refs-and-the-dom.html)
- Everything else will be overwritten (right-most value takes precedence)

## Installation

```sh
yarn add merge-attrs
npm i merge-attrs --save
```

## Usage

```js
import mergeAttrs from 'merge-attrs';

let merged = mergeAttrs({id: 'foo', className: 'bar', width: 200}, {className: 'corge', width: 150});
// {id: 'foo', className: 'bar corge', width: 150}
```


## API

```typescript
export interface ClassArray extends Array<ClassValue> {
}
export declare type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | false;
export interface ClassDictionary {
    [id: string]: boolean | undefined | null;
}
export interface IAttrs {
    className?: ClassValue;
    style?: {
        [prop: string]: string | number;
    };
    ref?: RefCallback;
    [key: string]: any;
}
export declare type RefCallback = (n: Element) => void;

export default function mergeAttrs(merged: IAttrs, ...attrDicts: IAttrs[]): IAttrs;
```

i.e., `mergeAttrs` takes one or more objects and merges them into the first argument and then returns it. If you don't want to mutate the first argument, pass `{}` instead -- just like `Object.assign`.
