# svg-to-react-webpack-loader

A [webpack](https://webpack.js.org/) loader that allows you to import .svg files into a [React](https://reactjs.org/) app and have them inlined without incurring an additional HTTP request.

Also allows you to add props onto the `<svg>` element at run-time, and a `<title>` and `<desc>` for accessibility.

## Compilation

### Input

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
    <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/>
</svg>
```

### Output

```
import {createElement as e} from 'react'
const C=({title,desc,...props})=>e("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 320 512"},props),title!=null?e("title",null,title):null,desc!=null?e("desc",null,desc):null,e("path",{d:"M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"}))
C.displayName="src/images/chevron-right.svg"
export default C
```


## Usage

```jsx
import Chevron from './images/chevron-right.svg';

const App = () => (
    <div>
        Hello icon <Chevron height={16} />
    </div>
)
```


## webpack.config.js

```js

const babelLoader = {
    loader: 'babel-loader',
    options: {
        cacheDirectory: true,
    },
};

const webpackConfig = {
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: babelLoader,
            },
            {
                test: /\.svg($|\?)/i,
                use: [babelLoader, 'svg-to-react-webpack-loader'],
            },
            ...
```

## TypeScript Support

Drop this in a `.d.ts` file:

```typescript
declare module "*.svg" {
    const content: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string, desc?: string }>;
    export default content;
}
```

## Prior Art

- [react-svg-loader](https://www.npmjs.com/package/react-svg-loader)
- [svg-react-loader](https://www.npmjs.com/package/svg-react-loader)
- [svg-to-react-loader](https://www.npmjs.com/package/svg-to-react-loader)
- [svg2react-loader](https://www.npmjs.com/package/svg2react-loader)

These names were already registered on npm 😢 No code was borrowed and no comparison is provided.

## License

MIT