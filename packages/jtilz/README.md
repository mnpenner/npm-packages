# Jtilz

JavaScript utility methods for node and web.

## Usage

### Node.js

Currently targeting Node 6. Will be updated for Node 8 when it becomes LTS.

```
const {getFiles} = 'jtilz';

getFiles(`${__dirname}/dir`).then(console.log);
```

### Web

The "web" version is only compatible with [webpack 2](https://webpack.js.org/). It uses ES6 modules (`export`) so that tree-shaking should work. Otherwise, you do not need to run Babel over the source; it is precompiled for IE8.

```
import Jtilz from 'jtilz';

let input = 'foo💩bar/../baz';
let output = Jtilz.encodeParam(input);
```

## API

See [docs/index.html](https://htmlpreview.github.io/?https://bitbucket.org/mnpenner/jtilz/raw/typescript/docs/index.html).