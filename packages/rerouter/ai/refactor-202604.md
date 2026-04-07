let's refactor packages/server-router

input:

- query params
- path params
- body params
- headers

output:

- status code
- body
- headers

---

Refactor packages/server-router

Each route should take an optional `match` function. It takes as input the request object and returns a boolean. If omitted, a default matcher will be built based on `pattern` (rename this to `path`), `method` and `accept`.

Each route should have a `schema` prop.


```ts
{
    schema: {
        request: {
            query: {},
            path: {},
            body: {},
        },
        response: {
            body: {
                200: {},
                400: {},
            }
        }
    }
}
```

Where `query` and `path` are JSON Object Schemas, and request body as any Json Schema (not necessarily an object).

The response body can be different for each status code.

Refactor `zodRoute`. Split it into 3 functions. `zodHandler` returns a handler function. `zodPartial` returns `{handler,schema}` (use `z.toJSONSchema(schema)` to have zod build the schemas), and `zodRoute` which returns the full `Route`.

The zod stuff should be thought of as an optional add on. So it can depend on the core router/routes, but not the other way around. Maybe start `packages/server-router/src/helpers/zod/` for this.

Refactor packages/server-router/src/response/openapi.ts. It can be built from the `schema` on the route objects. Move it to `packages/server-router/src/plugins/openapi/`

Refactor packages/server-router/src/bin/gen-api-client.ts. It should NOT try to deduce types from the TypeScript source code. Given a path to a file, it should dynamic `import()` it and call `.getRoutes()` on it to get the runtime routes, and then use the `schema` to build the types. Use the `json-schema-to-typescript` package to convert the JSON Schemas back to TS. Otherwise, the other options and output format should be the same as it is now.

Create packages/server-router/example3/router.ts. In this example, I want to have a fully typed route (request w/ query, path, body) and response with OK body and validation error body. The handler should return the data and then I want to use a middleware to send back either JSON or YAML based on the client's "Accept" header.
