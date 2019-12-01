# ouid

`ouid` (ordered unique identifier) generates universally-unique identifiers that sort in ascending order; i.e., each identifier will be greater than the last. This is important for performance reasons when inserting them into a database because B-tree indexes will not need to be rebalanced as new nodes are added -- each new entry will become a leaf node.

You would need to generate about a billion UUIDs in [5 microseconds](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) or [less](https://nodejs.org/api/process.html#process_process_hrtime_time) for a 2% chance of collision. On a modern computer, it takes about 40 µs (0.04 ms) to generate just one.

## Installation

```bash
npm i ouid
yarn add ouid
```

## API

### <del>browser</del>

Browser support has been dropped.

```js
import ouid from 'ouid';
console.log(new Uint8Array(ouid())); // Uint8Array(16) [20, 251, 185, 165, 210, 140, 210, 64, 118, 227, 170, 82, 137, 17, 231, 166]
```

### node

```js
const ouid = require('ouid');
console.log(ouid()); // <Buffer 14 fb b9 bd 9e eb 7c ec 00 b8 a4 23 79 ee e4 74>
```

There are no options. Just the one function.
