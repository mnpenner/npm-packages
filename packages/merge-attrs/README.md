# merge-attrs

Merge HTML attributes (for React).

- `undefined` values will not overwrite the current value
- `className` will be merged with [classnames](https://www.npmjs.com/package/classnames). 
- `style` performs a shallow merge via `Object.assign`.
- Event handlers (attributes beginning with "on") will be combined into a single function that executes all the handlers.
    - The same goes for [`ref`](https://facebook.github.io/react/docs/refs-and-the-dom.html)
- Everything else will be overwritten