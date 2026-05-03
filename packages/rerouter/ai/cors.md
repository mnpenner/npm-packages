Implement a CORs middleware at packages/server-router/src/middleware/cors.ts inspired by other frameworks but adapted for this project. Maybe add a dev mode like packages/server-router/src/middleware/csrf.ts if it'll be helpful. If you need to share any functions with that file, move the helpers under packages/server-router/src/lib/.

Docs for other popular CORs middlewares are below for your reference.

<hono>
# CORS Middleware

There are many use cases of Cloudflare Workers as Web APIs and calling them from external front-end application.
For them we have to implement CORS, let's do this with middleware as well.

## Import

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
```

## Usage

```ts
const app = new Hono()

// CORS should be called before the route
app.use('/api/*', cors())
app.use(
  '/api2/*',
  cors({
    origin: 'http://example.com',
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
)

app.all('/api/abc', (c) => {
  return c.json({ success: true })
})
app.all('/api2/abc', (c) => {
  return c.json({ success: true })
})
```

Multiple origins:

```ts
app.use(
  '/api3/*',
  cors({
    origin: ['https://example.com', 'https://example.org'],
  })
)

// Or you can use "function"
app.use(
  '/api4/*',
  cors({
    // `c` is a `Context` object
    origin: (origin, c) => {
      return origin.endsWith('.example.com')
        ? origin
        : 'http://example.com'
    },
  })
)
```

Dynamic allowed methods based on origin:

```ts
app.use(
  '/api5/*',
  cors({
    origin: (origin) =>
      origin === 'https://example.com' ? origin : '*',
    // `c` is a `Context` object
    allowMethods: (origin, c) =>
      origin === 'https://example.com'
        ? ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE']
        : ['GET', 'HEAD'],
  })
)
```

## Options

### <Badge type="info" text="optional" /> origin: `string` | `string[]` | `(origin:string, c:Context) => string`

The value of "_Access-Control-Allow-Origin_" CORS header. You can also pass the callback function like `origin: (origin) => (origin.endsWith('.example.com') ? origin : 'http://example.com')`. The default is `*`.

### <Badge type="info" text="optional" /> allowMethods: `string[]` | `(origin:string, c:Context) => string[]`

The value of "_Access-Control-Allow-Methods_" CORS header. You can also pass a callback function to dynamically determine allowed methods based on the origin. The default is `['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH']`.

### <Badge type="info" text="optional" /> allowHeaders: `string[]`

The value of "_Access-Control-Allow-Headers_" CORS header. The default is `[]`.

### <Badge type="info" text="optional" /> maxAge: `number`

The value of "_Access-Control-Max-Age_" CORS header.

### <Badge type="info" text="optional" /> credentials: `boolean`

The value of "_Access-Control-Allow-Credentials_" CORS header.

### <Badge type="info" text="optional" /> exposeHeaders: `string[]`

The value of "_Access-Control-Expose-Headers_" CORS header. The default is `[]`.

## Environment-dependent CORS configuration

If you want to adjust CORS configuration according to the execution environment, such as development or production, injecting values from environment variables is convenient as it eliminates the need for the application to be aware of its own execution environment. See the example below for clarification.

```ts
app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: c.env.CORS_ORIGIN,
  })
  return corsMiddlewareHandler(c, next)
})
```

## Using with Vite

When using Hono with Vite, you should disable Vite's built-in CORS feature by setting `server.cors` to `false` in your `vite.config.ts`. This prevents conflicts with Hono's CORS middleware.

```ts
// vite.config.ts
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: false, // disable Vite's built-in CORS setting
  },
  plugins: [cloudflare()],
})
```
</hono>

<elysia>
---
title: CORS Plugin - ElysiaJS
head:
- - meta
- property: 'og:title'
content: CORS Plugin - ElysiaJS

    - - meta
      - name: 'description'
        content: Plugin for Elysia that adds support for customizing Cross-Origin Resource Sharing behavior. Start by installing the plugin with "bun add @elysiajs/cors".

    - - meta
      - name: 'og:description'
        content: Plugin for Elysia that adds support for customizing Cross-Origin Resource Sharing behavior. Start by installing the plugin with "bun add @elysiajs/cors".
---

# CORS Plugin

This plugin adds support for customizing [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) behavior.

Install with:

```bash
bun add @elysiajs/cors
```

Then use it:

```typescript twoslash
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

new Elysia().use(cors()).listen(3000)
```

This will set Elysia to accept requests from any origin.

## Config

Below is a config which is accepted by the plugin

### origin

@default `true`

Indicates whether the response can be shared with the requesting code from the given origins.

Value can be one of the following:

- **string** - Name of origin which will directly assign to [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) header.
- **boolean** - If set to true, [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) will be set to `*` (any origins)
- **RegExp** - Pattern to match request's URL, allowed if matched.
- **Function** - Custom logic to allow resource sharing, allow if `true` is returned.
    - Expected to have the type of:
    ```typescript
    cors(context: Context) => boolean | void
    ```
- **Array<string | RegExp | Function>** - iterate through all cases above in order, allowed if any of the values are `true`.

---

### methods

@default `*`

Allowed methods for cross-origin requests.

Assign [Access-Control-Allow-Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) header.

Value can be one of the following:

- **undefined | null | ''** - Ignore all methods.
- **\*** - Allows all methods.
- **string** - Expects either a single method or a comma-delimited string
    - (eg: `'GET, PUT, POST'`)
- **string[]** - Allow multiple HTTP methods.
    - eg: `['GET', 'PUT', 'POST']`

---

### allowedHeaders

@default `*`

Allowed headers for an incoming request.

Assign [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) header.

Value can be one of the following:

- **string** - Expects either a single header or a comma-delimited string
    - eg: `'Content-Type, Authorization'`.
- **string[]** - Allow multiple HTTP headers.
    - eg: `['Content-Type', 'Authorization']`

---

### exposeHeaders

@default `*`

Response CORS with specified headers.

Assign [Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) header.

Value can be one of the following:

- **string** - Expects either a single header or a comma-delimited string.
    - eg: `'Content-Type, X-Powered-By'`.
- **string[]** - Allow multiple HTTP headers.
    - eg: `['Content-Type', 'X-Powered-By']`

---

### credentials

@default `true`

The Access-Control-Allow-Credentials response header tells browsers whether to expose the response to the frontend JavaScript code when the request's credentials mode [Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) is `include`.

When a request's credentials mode [Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) is `include`, browsers will only expose the response to the frontend JavaScript code if the Access-Control-Allow-Credentials value is true.

Credentials are cookies, authorization headers, or TLS client certificates.

Assign [Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) header.

---

### maxAge

@default `5`

Indicates how long the results of a [preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) (that is the information contained in the [Access-Control-Allow-Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) and [Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) headers) can be cached.

Assign [Access-Control-Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age) header.

---

### preflight

The preflight request is a request sent to check if the CORS protocol is understood and if a server is aware of using specific methods and headers.

Response with **OPTIONS** request with 3 HTTP request headers:

- **Access-Control-Request-Method**
- **Access-Control-Request-Headers**
- **Origin**

This config indicates if the server should respond to preflight requests.

## Pattern

Below you can find the common patterns to use the plugin.

## Allow CORS by top-level domain

```typescript twoslash
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
	.use(
		cors({
			origin: /.*\.saltyaom\.com$/
		})
	)
	.get('/', () => 'Hi')
	.listen(3000)
```

This will allow requests from top-level domains with `saltyaom.com`
</elysia>

<expressjs>
Usage
Simple Usage (Enable All CORS Requests)
var express = require('express')
var cors = require('cors')
var app = express()

app.use(cors())

app.get('/products/:id', function (req, res, next) {
res.json({msg: 'This is CORS-enabled for all origins!'})
})

app.listen(80, function () {
console.log('CORS-enabled web server listening on port 80')
})
Enable CORS for a Single Route
var express = require('express')
var cors = require('cors')
var app = express()

app.get('/products/:id', cors(), function (req, res, next) {
res.json({msg: 'This is CORS-enabled for a Single Route'})
})

app.listen(80, function () {
console.log('CORS-enabled web server listening on port 80')
})
Configuring CORS
See the configuration options for details.

var express = require('express')
var cors = require('cors')
var app = express()

var corsOptions = {
origin: 'http://example.com',
optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.get('/products/:id', cors(corsOptions), function (req, res, next) {
res.json({msg: 'This is CORS-enabled for only example.com.'})
})

app.listen(80, function () {
console.log('CORS-enabled web server listening on port 80')
})
Configuring CORS w/ Dynamic Origin
This module supports validating the origin dynamically using a function provided to the origin option. This function will be passed a string that is the origin (or undefined if the request has no origin), and a callback with the signature callback(error, origin).

The origin argument to the callback can be any value allowed for the origin option of the middleware, except a function. See the configuration options section for more information on all the possible value types.

This function is designed to allow the dynamic loading of allowed origin(s) from a backing datasource, like a database.

var express = require('express')
var cors = require('cors')
var app = express()

var corsOptions = {
origin: function (origin, callback) {
// db.loadOrigins is an example call to load
// a list of origins from a backing database
db.loadOrigins(function (error, origins) {
callback(error, origins)
})
}
}

app.get('/products/:id', cors(corsOptions), function (req, res, next) {
res.json({msg: 'This is CORS-enabled for an allowed domain.'})
})

app.listen(80, function () {
console.log('CORS-enabled web server listening on port 80')
})
Enabling CORS Pre-Flight
Certain CORS requests are considered ‘complex’ and require an initial OPTIONS request (called the “pre-flight request”). An example of a ‘complex’ CORS request is one that uses an HTTP verb other than GET/HEAD/POST (such as DELETE) or that uses custom headers. To enable pre-flighting, you must add a new OPTIONS handler for the route you want to support:

var express = require('express')
var cors = require('cors')
var app = express()

app.options('/products/:id', cors()) // enable pre-flight request for DELETE request
app.del('/products/:id', cors(), function (req, res, next) {
res.json({msg: 'This is CORS-enabled for all origins!'})
})

app.listen(80, function () {
console.log('CORS-enabled web server listening on port 80')
})
You can also enable pre-flight across-the-board like so:

app.options('*', cors()) // include before other routes
NOTE: When using this middleware as an application level middleware (for example, app.use(cors())), pre-flight requests are already handled for all routes.

Customizing CORS Settings Dynamically per Request
For APIs that require different CORS configurations for specific routes or requests, you can dynamically generate CORS options based on the incoming request. The cors middleware allows you to achieve this by passing a function instead of static options. This function is called for each incoming request and must use the callback pattern to return the appropriate CORS options.

The function accepts:

req:
The incoming request object.
callback(error, corsOptions):
A function used to return the computed CORS options.
Arguments:
error: Pass null if there’s no error, or an error object to indicate a failure.
corsOptions: An object specifying the CORS policy for the current request.
Here’s an example that handles both public routes and restricted, credential-sensitive routes:

var dynamicCorsOptions = function(req, callback) {
var corsOptions;
if (req.path.startsWith('/auth/connect/')) {
corsOptions = {
origin: 'http://mydomain.com', // Allow only a specific origin
credentials: true,            // Enable cookies and credentials
};
} else {
corsOptions = { origin: '*' };   // Allow all origins for other routes
}
callback(null, corsOptions);
};

app.use(cors(dynamicCorsOptions));

app.get('/auth/connect/twitter', function (req, res) {
res.send('CORS dynamically applied for Twitter authentication.');
});

app.get('/public', function (req, res) {
res.send('Public data with open CORS.');
});

app.listen(80, function () {
console.log('CORS-enabled web server listening on port 80')
})
Configuration Options
origin: Configures the Access-Control-Allow-Origin CORS header. Possible values:
Boolean - set origin to true to reflect the request origin, as defined by req.header('Origin'), or set it to false to disable CORS.
String - set origin to a specific origin. For example, if you set it to
"http://example.com" only requests from “http://example.com” will be allowed.
"*" for all domains to be allowed.
RegExp - set origin to a regular expression pattern which will be used to test the request origin. If it’s a match, the request origin will be reflected. For example the pattern /example\.com$/ will reflect any request that is coming from an origin ending with “example.com”.
Array - set origin to an array of valid origins. Each origin can be a String or a RegExp. For example ["http://example1.com", /\.example2\.com$/] will accept any request from “http://example1.com” or from a subdomain of “example2.com”.
Function - set origin to a function implementing some custom logic. The function takes the request origin as the first parameter and a callback (called as callback(err, origin), where origin is a non-function value of the origin option) as the second.
methods: Configures the Access-Control-Allow-Methods CORS header. Expects a comma-delimited string (ex: ‘GET,PUT,POST’) or an array (ex: ['GET', 'PUT', 'POST']).
allowedHeaders: Configures the Access-Control-Allow-Headers CORS header. Expects a comma-delimited string (ex: ‘Content-Type,Authorization’) or an array (ex: ['Content-Type', 'Authorization']). If not specified, defaults to reflecting the headers specified in the request’s Access-Control-Request-Headers header.
exposedHeaders: Configures the Access-Control-Expose-Headers CORS header. Expects a comma-delimited string (ex: ‘Content-Range,X-Content-Range’) or an array (ex: ['Content-Range', 'X-Content-Range']). If not specified, no custom headers are exposed.
credentials: Configures the Access-Control-Allow-Credentials CORS header. Set to true to pass the header, otherwise it is omitted.
maxAge: Configures the Access-Control-Max-Age CORS header. Set to an integer to pass the header, otherwise it is omitted.
preflightContinue: Pass the CORS preflight response to the next handler.
optionsSuccessStatus: Provides a status code to use for successful OPTIONS requests, since some legacy browsers (IE11, various SmartTVs) choke on 204.
The default configuration is the equivalent of:

{
"origin": "*",
"methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
"preflightContinue": false,
"optionsSuccessStatus": 204
}
</expressjs>
