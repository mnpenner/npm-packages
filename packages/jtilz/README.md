# Jtilz

JavaScript utility methods for Node.js, Bun, and Web.

## Features

- **Multi-environment**: Dedicated entry points for Node.js/Bun and Web.
- **Modern**: Built with TypeScript and optimized for modern runtimes.
- **Tree-shakable**: ESM-first design for minimal bundle sizes.

## Usage

### General

The package supports clean imports and automatically resolves to the appropriate version for your environment (Node.js/Bun or Browser).

```ts
import { encodeParam } from 'jtilz'
```

### Environment-specific

You can also explicitly import the version for your environment:

```ts
import { getFiles } from 'jtilz/node' // Node.js / Bun
import { encodeParam } from 'jtilz/web' // Web
```

## Deprecations

Some methods are now deprecated as they have been added to the language itself:

- `flatten` -> Use [`Array.prototype.flat`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat}
- `replaceAll` -> Use [`String.prototype.replaceAll`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll}
- `allSettled` -> Use [`Promise.allSettled`]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled}

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
