add a `tsdown.config.ts` to packages/server-router and packages/react-router. they should look something like this:

```ts
import { defineConfig } from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        aggregate: 'src/aggregate/index.ts',
        invoke: 'src/invoke/index.ts',
        result: 'src/result/index.ts',
    },
    platform: 'neutral',
    format: ['esm'],
    external: [/^(node|bun):/],
    exports: true,
    dts: true,  // The client must use "moduleResolution": "bundler", "node16" or "nodenext". "node" will not resolve the types properly.
})

```

adjust the entry points as needed. the server one can have platform: "node", the react one can have platform: "browser".

add a "build" command in the root package.json that runs the "build" script for each of the packages. the build command is just `tsdown`

run `bun add --dev tsdown` in the 2 package dirs

---

add packages/react-router/examples.

an example is like

```tsx
export const ROUTES: Route[] = [
    ['/', lazy(() => import('./pages/home.tsx'))],
    ['/games/chess', lazy(() => import(`./pages/games/chess.tsx`))],
    ['/login', lazy(() => import(`./pages/login.tsx`))],
    ['/matches/:id', lazy(() => import(`./pages/match.tsx`))],

    ['*', NotFound],
]


export function Layout() {
    return <div>
        <h1>My App</h1>
        <Router routes={ROUTES}/>
    </div>
}
```

you can simplify it a bit.

add a script "ex:gen" which will run the generator on ROUTES.

likewise, add "ex:gen" for server-router. and then an "ex:gen" in the root package.json that will regenerate all the examples.

---

Update AGENTS.md as needed. We basically want...

- "build:pkg" everything which builds the projects for publishing to npm
- "build:ex" which runs the 'bin' generators so we can manually inspect the output and make sure it makes sense.
- "test:types" which checks for typescript errors (renamed from build:tsc)
- "test:impl" which runs the tests in the examples (we will need to add some bun .test.ts files but not just yet)
- "test:gen" which runs "build:pkg" and then *tests* the generated code
