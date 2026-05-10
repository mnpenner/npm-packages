# @mpen/rerouter

A lightweight, type-safe router for React with a CLI for generating URL helpers.

## Features

- **Small footprint**: Focuses only on the essentials of routing.
- **Type-safe URL generation**: CLI tool imports your route file and generates helper functions, ensuring you never have broken links.
- **Support for `path-to-regexp`**: Familiar syntax for route patterns.
- **Native `URLPattern` support**: Can use the browser's native `URLPattern` API.
- **Hooks-based**: Easy access to current path and search parameters.

## Installation

```bash
bun add @mpen/rerouter
```

## CLI: `rerouter`

The package includes a CLI tool to generate type-safe route helpers from your route definitions.

### Usage

1. Define your routes in a dedicated `.ts` file:

```ts
// routes.ts
export default [
    { name: 'home', pattern: '/', component: () => import('./pages/Home') },
    { name: 'userProfile', pattern: '/user/:id', component: () => import('./pages/UserProfile') },
    { pattern: '/user/:id/settings', component: () => import('./pages/UserProfile') },
]
```

Keep this file side-effect-free. The CLI imports and evaluates the route file to extract route names and patterns, so avoid top-level browser access, data fetching, app bootstrapping, or eager page component imports. Put route components behind `() => import('./pages/...')` loaders so generation does not pull page modules into the CLI process.

The `name` field is optional. Named string-pattern routes are included in generated URL helpers; unnamed routes still match at runtime but are skipped by the generator.

2. Run the generator:

```bash
bunx @mpen/rerouter routes.ts -o src/routes.gen.ts
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
import { Router } from '@mpen/rerouter'
import ROUTES from './routes'

function App() {
    return <Router routes={ROUTES} loading={<div>Loading...</div>} />
}
```

`loading` is delayed by 300ms by default to avoid flashing fallback UI during quick route
loads. Pass `loadingDelayMs={0}` to show it immediately, or another millisecond value to tune
the delay.

### Link

```tsx
import { Link } from '@mpen/rerouter'
import { userProfile } from './routes.gen'

function Navigation() {
    return <Link href={userProfile({ id: 'me' })}>My Profile</Link>
}
```

### Hooks

```tsx
import { useUrlPath, useUrlSearchParams } from '@mpen/rerouter'

function MyComponent() {
    const path = useUrlPath()
    const searchParams = useUrlSearchParams()
    // ...
}
```
