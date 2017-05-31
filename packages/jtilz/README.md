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

These are the methods that are currently available in Node. With the exception of the file operations, the web version should be mostly the same. Will document in more detail later.

- `bindable`
- `fmap`
- `loadScript`
- `memoize`
- `uuid`
- `flatten`
- `map`
- `filterAsync`
- `flatMap`
- `groupBy`
- `thru`
- `tap`
- `toArray`
- `toSet`
- `format`
- `log`
- `__skip__`
- `readFile`
- `writeFile`
- `readText`
- `readJson`
- `readDir`
- `fileStat`
- `fileAccess`
- `fileExists`
- `getFiles`
- `md5`
- `isNativeFunction`
- `isFunction`
- `isString`
- `isNumber`
- `isBoolean`
- `isRegExp`
- `isDate`
- `isSet`
- `isMap`
- `isWeakMap`
- `isArray`
- `isNull`
- `isUndefined`
- `isObject`
- `isPlainObject`
- `isSymbol`
- `isBuffer`
- `hrtimeToMs`
- `hrtimeElapsed`
- `divQR`
- `wholeFrac`
- `toHex`
- `entries`
- `mapEntries`
- `omit`
- `pairsToObject`
- `mergeDeep`
- `promisify`
- `promisifyAll`
- `allSettled`
- `replaceAll`
- `percentEncode`
- `encodeParam`
- `queryParams`
- `value`
- `identity`
