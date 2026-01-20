Help me flesh out this prompt for Codex.

The logger should be able to produce JSONL / k8s OTel compatible format like, something like

{
"timestamp": "2026-01-16T21:15:02.789Z",
"severity": "INFO",
"message": "request completed",

"service.name": "hub",
"deployment.environment": "prod",

"trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
"span_id": "00f067aa0ba902b7",

"http.request.method": "GET",
"url.path": "/users/123",
"http.route": "/users/{id}",
"http.response.status_code": 200,
"server.address": "hub.mpen.ca",
"client.address": "203.0.113.42",
"user_agent.original": "Mozilla/5.0",

"duration_ms": 123,
"error.type": null
}


Middlewares should be able to add things into the logger.. like setting the requestId so that all subsequent logs include it.

Handlers should be able to create 'sub-loggers' which they can use throughout the remainder of the handler and have all logs associated with it.

It should be possible to adapt existing loggers like https://tslog.js.org/ into this interface

I need to be able control the log format, so I can write plain JSON to my k8s logs when deployed for production, but render pretty styled output to my console during development.

I need to be able to filter logs by both log level and logger/sublogger name. Maybe using env vars.

Or maybe its better if the LoggerCtxOptions takes in a single log(entry: LogEntry) function as input but adds a full logger to the context.

I'm thinking maybe LogEntry should contain a Record for 'well-known' values like 'requestId' but also a section for random debug values. Maybe something the request id middleware can do soemthing like

this.logger.set('requestId', 123)

And then maybe some sort of breadcrumb system like sentry...

this.logger.addBreadcrumb('i was here')

which gets pushed into an array in LogEntry. Not sure, please take some inspiration from Sentry.

Should breadcrumbs be 'stack' based? e.g. they can get popped off again? like I'm thinking some middleware does

```ts
function mymiddleware(ctx, next) {
    ctx.logger?.push('something')
    await next()
    ctx.logger?.pop()
}
```

But I don't know how well that work if something in next() is also pushing things in but not popping... might not be the right API.



Create `packages/server-router/src/middleware/logger-ctx.ctx`.

This middleware injects a logger into the context for use by other middleware and handlers. You can provide your own logger that implements the interface below, or one will be provided automatically.


```ts
export interface LoggerCtxOptions<Ctx extends object = AnyContext> {
    logger: LoggerInterface|(ctx)=>LoggerInterface
}

enum LogLevel {
    TRACE='trace',
    DEBUG='debug',
    INFO='info',
    WARN='warn',
    ERROR='error',
    FATAL='fatal',
}

interface LoggerInterface {
    trace()
    debug()
    info()
    warn()
    error()
    fatal()
}

interface LogEntry {
    level: LogLevel // or is "severity" better/more standard?
    message: string
    timestamp: number
    // ....
}

class Logger implements LoggerInterface {
    info(...vars: any[]) {
        if(vars.length === 1 && typeof vars[0] === 'string') {
            this.log({message: vars[0], level: LogLevel.INFO})
        } else {
            this.log({vars: vars, level: LogLevel.INFO})
        }
    }
    
    private log(entry: LogEntry) {
        console.log(entry)
    }
}
```

---

Create a 2nd middleware `packages/server-router/src/middleware/request-logger.ctx`.

This will utilize the first middleware to log each request as it comes in and as its sent, with timings.

```ts
export interface RequestLoggerOptions<Ctx extends object = AnyContext> {
    logLevel: LogLevel|{
        1: LogLevel  // 1xx responses
        2: LogLevel  // 2xx responses...
        3: LogLevel
        4: LogLevel
        5: LogLevel
    } // defaults to INFO or ERROR or 5xx
}
```
