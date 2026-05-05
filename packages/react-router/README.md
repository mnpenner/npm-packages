# @mpen/react-router

A lightweight, type-safe router for React with a CLI for generating URL helpers.

> [!IMPORTANT]
> This package is **NOT** related to the official [React Router](https://reactrouter.com/) library. It is a much smaller, independent implementation focused on simplicity and type safety through code generation.

## Features

- **Small footprint**: Focuses only on the essentials of routing.
- **Type-safe URL generation**: CLI tool generates helper functions for your routes, ensuring you never have broken links.
- **Support for `path-to-regexp`**: Familiar syntax for route patterns.
- **Native `URLPattern` support**: Can use the browser's native `URLPattern` API.
- **Hooks-based**: Easy access to current path and search parameters.

## Installation

```bash
bun add @mpen/react-router
```

## CLI: `react-router`

The package includes a CLI tool to generate type-safe route helpers from your route definitions.

### Usage

1. Define your routes in a `.tsx` (or `.ts`) file:

```tsx
// routes.tsx
export default [
    { name: 'home', pattern: '/', component: Home },
    { name: 'userProfile', pattern: '/user/:id', component: UserProfile },
]
```

2. Run the generator:

```bash
bunx @mpen/react-router routes.tsx -o src/routes.gen.ts
```

3. Use the generated helpers:

```tsx
import { userProfile } from './routes.gen'

// Returns "/user/123"
const url = userProfile({ id: 123 })
```

## Library Usage

### Router

```tsx
import { Router } from '@mpen/react-router'
import ROUTES from './routes'

function App() {
    return <Router routes={ROUTES} />
}
```

### Link

```tsx
import { Link } from '@mpen/react-router'
import { userProfile } from './routes.gen'

function Navigation() {
    return <Link href={userProfile({ id: 'me' })}>My Profile</Link>
}
```

### Hooks

```tsx
import { useUrlPath, useUrlSearchParams } from '@mpen/react-router'

function MyComponent() {
    const path = useUrlPath()
    const searchParams = useUrlSearchParams()
    // ...
}
```
