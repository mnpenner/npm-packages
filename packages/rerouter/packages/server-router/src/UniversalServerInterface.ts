export type UniversalFetchResult = Response | Promise<Response>

export interface UniversalExecutionContext {
    waitUntil(promise: Promise<any>): void
    passThroughOnException?(): void
}

type BunRuntimeServer = import('bun').Server<unknown>

export type DenoServer = {
    fetch(request: Request): UniversalFetchResult
}

export type BunServer = {
    fetch(request: Request, server: BunRuntimeServer): UniversalFetchResult
}

export type CloudflareWorkerServer<Env = unknown, Ctx = UniversalExecutionContext> = {
    fetch(request: Request, env: Env, ctx: Ctx): UniversalFetchResult
}

export type ValTownRequestHandler = (request: Request) => UniversalFetchResult

export type UniversalServerInterface<Env = unknown, Ctx = UniversalExecutionContext> =
    | DenoServer
    | BunServer
    | CloudflareWorkerServer<Env, Ctx>
    | ValTownRequestHandler
