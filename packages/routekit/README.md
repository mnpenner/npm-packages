# @mpen/routekit

Typed server-side routing utilities for Fetch-compatible runtimes.

`routekit` is a small router around the platform `Request`/`Response` APIs. It matches
`URLPattern` routes, runs typed middleware, supports schema-backed handlers with Zod or
Valibot, can expose route metadata as OpenAPI, and can generate a typed API client from
the same router definitions.

## Installation

```bash
bun add @mpen/routekit
```

Install the schema library you plan to use:

```bash
bun add zod
# or
bun add valibot @valibot/to-json-schema
```

## Quick Start

```ts
import { Router, ok } from '@mpen/routekit'

const router = new Router()

router.get('/', () => ok({ message: 'Hello World!' }))

router.get('/users/:id', ({ pathParams }) => {
    const { id } = pathParams as { id: string }
    return ok({ id })
})

export default router
```

Use the router anywhere a Fetch-compatible handler is accepted:

```ts
import router from './router'

Bun.serve({
    port: 3000,
    fetch: router.fetch,
})
```

You can also exercise a router directly in tests:

```ts
const response = await router.fetch(new Request('https://example.com/users/123'))
expect(await response.json()).toEqual({ id: '123' })
```

## Routing

Routes can be registered with method helpers:

```ts
router.get('/health', () => text('ok'))
router.head('/health', () => noContent())
router.post('/items', async ({ req }) => ok(await req.json()))
router.put('/items/:id', () => text('updated'))
router.patch('/items/:id', () => text('patched'))
router.delete('/items/:id', () => text('deleted'))
```

Or with a full route definition:

```ts
import { HttpMethod } from '@mpen/http'

router.add({
    name: 'items.detail',
    method: HttpMethod.GET,
    path: '/items/:id',
    accept: 'application/json',
    meta: {
        openapi: {
            summary: 'Fetch an item',
        },
    },
    handler: ({ pathParams }) => ok({ id: (pathParams as { id: string }).id }),
})
```

`path` may be a string or a `URLPattern`. Named path parameters are exposed on
`ctx.pathParams`. When a route name is omitted, routekit derives one from the method and
path so tooling such as API client generation still has a stable name to work with.

Routers can be mounted under a prefix:

```ts
const api = new Router()
api.get('/health', () => new Response('ok'))

const app = new Router()
app.mount('/api', api)
```

## Handler Results

Handlers may return:

- a `Response`
- a `RoutekitResponse` from helpers such as `ok()`, `response()`, `text()`, or `html()`
- a `string`, `Uint8Array`, `Buffer`, or `ReadableStream` for raw native bodies
- a structured object wrapped with `ok()` for content negotiation
- an async generator that yields typed response directives

For structured responses, return `ok(value)`. When no `Content-Type` is set, the router
serializes the body using the request's `Accept` header:

```ts
router.get('/profile', () => ok({ name: 'Ada' }))
```

Use `text()` and `html()` for represented bodies that should skip negotiation:

```ts
router.get('/health', () => text('ok'))
```

Streaming handlers yield explicit directives:

```ts
router.get('/events', async function* () {
    yield head(HttpStatus.OK, { 'content-type': 'text/plain; charset=utf-8' })
    yield chunk('hello ')
    yield chunk('world')
})
```

## Middleware

Middleware runs in registration order and can add fields to the request context. The
added fields are reflected in handler types.

```ts
import type { ContextMiddleware } from '@mpen/routekit'

const auth: ContextMiddleware<{ userId: string }> = (ctx) => {
    ctx.userId = 'user-123'
}

const router = new Router().use(auth)

router.get('/me', ({ userId }) => ok({ userId }))
```

Middleware can also wrap downstream results:

```ts
router.use(async (_ctx, next) => {
    const response = await next()
    if (response instanceof Response) {
        response.headers.set('x-powered-by', 'routekit')
    }
    return response
})
```

Built-in middleware is available from `@mpen/routekit/middleware`:

```ts
import {
    acceptCtx,
    bodyLimit,
    cors,
    loggerCtx,
    requestIdCtx,
    startTimeCtx,
} from '@mpen/routekit/middleware'

router.use([
    startTimeCtx(),
    requestIdCtx({ writeHeaderName: 'x-request-id' }),
    acceptCtx(),
    loggerCtx(),
    bodyLimit({ maxSize: 1024 * 1024 }),
    cors({ origin: 'https://app.example.com', credentials: true }),
])
```

`rateLimit()` supports fixed-window identity, subnet, ASN, country, and endpoint limits.
It can use the default in-memory storage or a custom `RateLimitStorage` implementation.

## Zod Routes

Zod helpers validate request input, infer typed `params`, and attach JSON Schema metadata
to routes for OpenAPI and client generation.

```ts
import { HttpStatus } from '@mpen/http'
import { Router, ok } from '@mpen/routekit'
import { withZod } from '@mpen/routekit/routes'
import { z } from 'zod'

const router = new Router()

router.post(
    '/books/:id',
    withZod({
        name: 'books.byId',
        schema: {
            request: {
                path: z.object({ id: z.coerce.number().int() }),
                body: z.object({
                    title: z.string(),
                    author: z.string(),
                }),
            },
            response: {
                body: {
                    [HttpStatus.OK]: z.object({
                        id: z.number().int(),
                        title: z.string(),
                        author: z.string(),
                    }),
                },
            },
        },
        handler: ({ params }) =>
            ok({
                id: params.path.id,
                title: params.body.title,
                author: params.body.author,
            }),
    }),
)
```

Available Zod helpers:

- `zodHandler(options)` builds a validated handler.
- `zodPartial(options)` returns `{ handler, schema }`.
- `withZod(options)` returns method-helper route options.
- `zodRoute(options)` returns a full route definition.
- `createZodRoutes(defaults)` creates a route helper with shared schema, validation, and error handling defaults.

Request validation failures return a `400` JSON response by default. Override
`validationError` to customize that response. Response validation defaults to
`process.env.NODE_ENV !== 'production'` and can be controlled with `validateResponse`.

## Valibot Routes

Valibot helpers expose the same shape as the Zod helpers:

```ts
import { HttpStatus } from '@mpen/http'
import { ok } from '@mpen/routekit'
import { withValibot } from '@mpen/routekit/routes'
import * as v from 'valibot'

router.post(
    '/books/:id',
    withValibot({
        name: 'books.byId',
        schema: {
            request: {
                path: v.object({
                    id: v.pipe(
                        v.string(),
                        v.transform((value) => Number(value)),
                        v.integer(),
                    ),
                }),
                body: v.object({
                    title: v.string(),
                    author: v.string(),
                }),
            },
            response: {
                body: {
                    [HttpStatus.OK]: v.object({
                        id: v.number(),
                        title: v.string(),
                        author: v.string(),
                    }),
                },
            },
        },
        handler: ({ params }) =>
            ok({
                id: params.path.id,
                title: params.body.title,
                author: params.body.author,
            }),
    }),
)
```

Available Valibot helpers:

- `valibotHandler(options)`
- `valibotPartial(options)`
- `withValibot(options)`
- `valibotRoute(options)`
- `createValibotRoutes(defaults)`

## OpenAPI

The `openapi()` handler reflects the active router's registered routes and schema metadata.

```ts
import { openapi } from '@mpen/routekit/handlers'

router.get(
    '/openapi.json',
    openapi({
        info: {
            title: 'Example API',
            version: '1.0.0',
        },
        servers: [{ url: 'https://api.example.com' }],
    }),
)
```

Route `meta.openapi` is merged into the generated operation, so route-level summaries,
tags, security, and custom responses can be supplied beside the handler.

## Generated API Clients

`routekit-gen-api-client` loads a router module, reads `router.getRoutes()`, and writes a
typed client from each route's name, method, path, and JSON Schema metadata.

```bash
bun run routekit-gen-api-client ./src/server/router.ts -o ./src/client/api-client.gen.ts -p
```

The router module must export a router instance as `default`, `router`, or another named
export with a `getRoutes()` method.

Generated clients use `@mpen/routekit/client`:

```ts
import { FetchTransport } from '@mpen/routekit/client'
import { ApiClient } from './api-client.gen'

const client = new ApiClient(
    new FetchTransport({
        baseUrl: 'https://api.example.com',
        headers: () => ({ authorization: `Bearer ${token}` }),
    }),
)

const response = await client.books.byId.post({
    path: 123,
    body: { title: 'Dune', author: 'Frank Herbert' },
    headers: { 'content-type': 'application/json' },
})

if (response.ok) {
    const book = await response.parseBody()
    console.log(book.title)
}
```

Routes with multiple documented response statuses generate a response union narrowed by
`response.status`:

```ts
const response = await client.widgets.byId.post(options)

if (response.status === 400) {
    const body = await response.parseBody()
    console.log(body.message)
}
```

Use `--client-name <Name>` to change the generated class name, `--import-type
<Type:module>` for external schema-generated types, and `--response-type <Type>` to use a
custom generic response wrapper.

## Exports

- `@mpen/routekit` exports `Router`, response helpers, and core router types.
- `@mpen/routekit/routes` exports the Zod and Valibot route helpers.
- `@mpen/routekit/middleware` exports built-in middleware.
- `@mpen/routekit/handlers` exports `openapi()`.
- `@mpen/routekit/client` exports generated-client transports, response wrappers, body codecs, and URL/header helpers.

## Development

From this repository:

```bash
bun run --cwd packages/routekit build
bun test packages/routekit
bun run --cwd packages/routekit gen
bun run --cwd packages/routekit gen3
```

The generated example clients live under `packages/routekit/examples`.
