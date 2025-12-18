- Split packages/http-helpers/src/http-enums.ts into separate files. one enum per file.
- packages/react-router/src/draft is what I had in mind for a react/client-side router. Polish that up and move it out of the draft/ dir
- I wanted to do something like experimental/url-pattern/path-to-regexp.ts (which outputs experimental/url-pattern/dist/path-to-regexp.gen.ts) which is similar to packages/server-router/gen-api-client.ts but for packages/react-router. Get that working. Indent the output properly. Add a similar "Do not modify this file. ..." header
- Update the package.json for client-router and server-router to link the "bin". put the bin files under src/
- What's going on with the root tsconfig.json ? I don't think it should have "DOM" stuff in there, not all the packages have a DOM (e.g. the server packages). Do you eed the "exclude" when you have a "include" ? Do we need tsconfig.test.json ?
- Refactor packages/server-router/src/UniversalServerInterface.ts. I think it should be like UniversalServerInterface = BunServer|DenoServer|CloudflareWorkerServer|ValTownRequestHandler.

The bun 'default syntax' is like:

```ts
import type { Serve } from "bun";

export default {
  fetch(req) {
    return new Response("Bun!");
  },
} satisfies Serve.Options<undefined>;
```

The ValTown one is like

```ts
export default async function(req: Request) {
    return new Response(...)
}
```

`deno serve` is like

```ts
export default {
  async fetch(request) {
    return new Response("Hello world!");
  },
};
```

The cloudflare one is something like

```sh
// 1. Define the interface for your environment variables and bindings (KV, D1, R2, etc.)
export interface Env {
  // Example bindings:
  // MY_KV_NAMESPACE: KVNamespace;
  // MY_QUEUE: Queue;
  // DB: D1Database;
  // API_KEY: string;
}

// 2. The standard Cloudflare Worker Context interface
export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// 3. The main "Worker Server" interface
// This is the object you export as default
export interface ExportedHandler<E = Env> {
  fetch(
    request: Request,
    env: E,
    ctx: ExecutionContext
  ): Response | Promise<Response>;
  
  // Optional: handlers for other events
  scheduled?(
    controller: ScheduledController,
    env: E,
    ctx: ExecutionContext
  ): void | Promise<void>;
  
  email?(
    message: ForwardableEmailMessage,
    env: E,
    ctx: ExecutionContext
  ): void | Promise<void>;
}
```

Choose names that make sense. Not sure if we should call them "handlers" or "server" or what. I would call the req -> res function a handler. The object that *holds* the handler is closer to a server but it isn't really because it doesn't open ports and all of that jazz, so I don't know what to call it.

The cloudflare one can be like this actually:

```ts
import type { Request as WorkerRequest, ExecutionContext } from "@cloudflare/workers-types/experimental"

export default {
    fetch(request: WorkerRequest, env: unknown, ctx: ExecutionContext) {
        return new Response("OK")
    }
}
```

We can use their types directly but I still want a type for the default export object
