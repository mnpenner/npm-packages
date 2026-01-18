For packages/server-router:

Let's refactor how middleware and Router.mount works.

Firstly, middleware should be able to add things to the Router Ctx.

For example, it should be possible to write a middleware like:

```ts
declare global {
    var _requestCounter: number
}

globalThis._requestCounter ??= 0

export const addRequestId = (): ContextMiddleware<{ requestId: number }> => ctx => {
    ctx.requestId = ++globalThis._requestCounter
}
```

And then do

```
export const router = new Router()

router
    .use(addRequestId())
    .add({
       pattern: '/',
       handler: ctx => {
            console.log(ctx.requestId)
       }
    })
```

And have `ctx.requestId` inferred correctly.

We will probably need to make `.use` return a new Router with the modified <Ctx>.

I also want to be able to split routes into multiple files. Since Ctx cannot automagically infer across files, what I'm thinking is the pattern should be like:

```ts
// base.ts
export const router = new Router()
router.use(middleware1());
router.use(middleware2());

// subrouter1.ts
import { router } from './base.ts'
router.add({ ... })

export { router }

// subrouter2.ts
import { router } from './base.ts'
router.add({ ... })

export { router as default }

// index.ts
import router1 from './subrouter1.ts'
import router2 from './subrouter2.ts'

export default router = new Router()
router.mount('/', router1)
router.mount('/path', router2)
```

OR maybe better:

```ts
// shared-middleware.ts
export const middleware: MiddlewareList = [   // simple array is ideal but some middleware-container is acceptable if needed
    middleware1(),
    middleware2()
]

// subrouter.ts
import {middleware} from './shared-middleware.ts'
export const router = new Router()
router.use(middleware)
```

Also, I want to be able to create groups of routes with their own middleware in a single file:

```ts
export default router = new Router()
    .use(middleware1())
    .add(...)
    .group([middleware2(), middleware3()], subrouter => {
        subrouter.add(...)  // inherits middleware1 and adds middleware2 and middleware3
    })
```

You may adapt the examples if we need to use method chaining for the types to carry through.
