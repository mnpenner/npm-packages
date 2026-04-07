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


---

Let's define 3 sorts of things, and organize the src/ code accordingly:

- addons: extras/addons/utilities that help build routes or work with the router without injecting anything into the router. e.g. zod
- middleware: can be added in the router. They run before or after the handler. They can add things into the context or modify the response. e.g. csrf, loggers, body transformers.
- plugins: similar to middelware, but can add brand new routes by introspecting other routes. e.g. openapi/swagger.
  - note: if when used like `handler: openapi({...})` that would be an "addon".


---

Note that Handler (from packages/server-router/src/types.ts) can be much more loosely typed now. The TReqBody, TReqPath etc can all be moved to the schema. We just need the Ctx to properly type the handler func. Zod handlers, however, will need those extra types to type the handler func properly.

---

When adding in middleware, its unclear if middleware will be inherited from the parent scope. Maybe we should split out the methods to be more clear

- `.addGroup` vs `.replaceGroup`. Or maybe `.group({inherit:true,middleware:[]}`
- `.mount` --> `.mount({prefix:'/api',middleware:[],inherit:true}, subRouter); I think .group` and `.mount` can be combined if we just add these options in.
  - Maybe by default if you use `subrouter => { ... }` syntax then it will inherit (subrouter will have the middleware in it), but if you do `.mount(new Router().get('/foo',...))` it will not inherit because it's a "new" router (and probably coming from another file). Or maybe this is the *only* way to specify inheritance.
- What does `.use` do? Modify the current group? What about groups/mounts? Can/should we drop `.use`? Maybe the only way to set the middleware is via the c'tor or `.mount`.
- What's the difference between `.mount` and `.group`? I think the only difference is that `.mount` adds a path prefix.


---

For the zod handler args, group pathParams, query and body into `{params:{path,query,body}}`

Let's make `validateResponse` an option for zod handler. Defaults to `process.env.NODE_ENV !== 'production'`.

Let's introduce a new `ZodRouteFactory` class. It will take the options like `validateResponse` and `validationError`. Then you can reuse it likw `factory.route(...)` and it will apply those options as defaults (can still be overridden per rotue).

Put the factory in `packages/server-router/src/helpers/zod/factory.ts`

Don't worry about backwards compat. This package has not been released.

---

OTel: https://opentelemetry.io/docs/languages/js/getting-started/nodejs/

Is this a 'plugin' or an addon...? or middleware? Maybe multiple.
