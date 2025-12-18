export type UniversalFetchResult = Response | Promise<Response>

export interface UniversalExecutionContext {
    waitUntil(promise: Promise<any>): void
    passThroughOnException?(): void
}

type BunServer = import('bun').Server<unknown>

export interface UniversalServerInterface<Env = unknown, Ctx = unknown> {
    // Deno default export shape
    fetch(request: Request): UniversalFetchResult

    // Bun default export shape (2nd arg is Bun.Server)
    fetch(request: Request, server: BunServer): UniversalFetchResult

    // Cloudflare Workers module shape
    fetch(request: Request, env: Env, ctx: Ctx): UniversalFetchResult
}
