in packages/server-router/src/router.ts make it so the handler is invoked with `this` being the Router instance.

add a `meta` field to the `Route` interface to store arbitrary metadata like

```json
{
    pattern: "/pets",
    method: "GET",
    meta: {
        openapi: {
            "description": "Returns all pets from the system that the user has access to",
            responses: {
                200: {
                    description: "A list of pets",
                    content: {
                        "application/json": {
                            "schema": {}
                        }
                    }
                }
            }
        }
    }
}
```

implement packages/server-router/src/response/openapi.ts which can be used like

```ts
router.add({
    pattern: "/swagger.json",
    method: openapi(options)
})
```

`openapi()` will use `this` to iterate over the routes and generate a response like


```
{
  "openapi": "3.0.3",
  "info": {
    "title": "Example API",
    "version": "1.0.0",
    "description": "Demo API"
  },
  "servers": [
    { "url": "https://api.example.com" }
  ],
  "paths": {
    "/users/{id}": {
      "get": {
        "summary": "Get user",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/User" }
              }
            }
          },
          "404": { "description": "Not found" }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "required": ["id", "email"],
        "properties": {
          "id": { "type": "string" },
          "email": { "type": "string", "format": "email" }
        }
      }
    },
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "security": [{ "bearerAuth": [] }]
}
```

The paths and HTTP methods can be determined from the routes. The "info" and "servers" can be taken as options. The path summary, parameters and responses can be read from meta.openapi if it's available.


also implement packages/server-router/src/routes/zod.ts. It should have a method called `zodRoute` which takes in an object that extends `Route`.
It should add additional options like

{
body?: BodySchema,
query?: QuerySchema,
path?: PathSchema,
handler: fn
validationError?: fn
}

The handler should be similar to a normal Route Handler but it should add {query,body,path} to the context if they were specified. These should be read the corresponding fields out of {req} and parse them with them using the passed in schema (using safeParse) and then set them on the context. If validation fails, it should call the validationError function with the ValidationError enum and zod error.

```
export const enum ValidationError {
    REQUEST_BODY,
    URL_PATH,
    QUERY_PARAMETERS,
}
```

If left unspecified, the default validation error handler should return a 400 with JSON response like

```
 {
        component: 'request_body'|'url_path'|'query_parameters',
        errorTree: z.treeifyError(error),
        message: z.prettifyError(error),
    }
```

zodRoute should return the Route so it can be added the Router. It should also fill in meta.openapi using z.toJSONSchema (see docs/zod/json-schema.mdx)

The returned Handler should be strongly typed with the <<TReqBody, TReqPath, TReqQuery, TOkRes> parameters inferred from the schema and TErr can perhaps be inferred from the validationError function if possible.
