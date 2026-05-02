# Jtilz

JavaScript utility methods for Node.js, Bun, and Web.

## Features

- **Multi-environment**: Dedicated entry points for Node.js/Bun and Web.
- **Modern**: Built with TypeScript and optimized for modern runtimes.
- **Tree-shakable**: ESM-first design for minimal bundle sizes.

## Usage

### Node.js / Bun

Supports modern Node.js and Bun runtimes.

```ts
import {getFiles} from 'jtilz';

const files = await getFiles('./src');
console.log(files);
```

### Web

Compatible with modern bundlers like Vite and Webpack.

```ts
import {encodeParam} from 'jtilz';

const output = encodeParam('foo💩bar/../baz');
```

## Development

This package uses [Bun](https://bun.sh) for development.

### Build

```bash
bun run build
```

### Test

```bash
bun test
```

### Lint

```bash
bun run lint
```