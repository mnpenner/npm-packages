# js-serialize

Like `JSON.stringify`, but supports more types.

## Installation

```bash
yarn add js-serialize
npm i js-serialize -S
```

## Examples

```js
> jsSerialize = require('js-serialize')
{ [Function: jsSerialize] raw: [Function: raw] }

> jsSerialize('foo')
'"foo"'

> jsSerialize(1)
'1'

> jsSerialize([2,3])
'[2,3]'

> jsSerialize(new Set([4,5]))
'new Set([4,5])'

> jsSerialize(new Set([4,5]))
'new Set([4,5])'

> jsSerialize(new Map([["a",1],["b",2]]))
'new Map([["a",1],["b",2]])'

> jsSerialize(Symbol.for('bar'))
'Symbol.for("bar")'

> jsSerialize([true,false,null,undefined])
'[true,false,null,undefined]'

> jsSerialize(new Array(4))
'new Array(4)'

> jsSerialize([undefined,undefined])
'[undefined,undefined]'

> jsSerialize([,,5,,])
'[,,5,,]'

> jsSerialize(isNaN)
'isNaN'

> jsSerialize(Math.sin)
'Math.sin'

> jsSerialize({a:1,b:{2:3}})
'{a:1,b:{"2":3}}'

> jsSerialize({a:1,b:jsSerialize.raw('() => { console.log("arbitrary"); }')})
'{a:1,b:() => { console.log("arbitrary"); }}'

> jsSerialize(function quux(){})
'function quux(){}'

> jsSerialize(x => x*2)
'x => x*2'

> jsSerialize(() => '</script>')
'() => \'<\\/script>\''
```