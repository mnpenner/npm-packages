export type UniversalFetchResult = Response | Promise<Response>

export interface UniversalExecutionContext {
    waitUntil(promise: Promise<any>): void
    passThroughOnException?(): void
}

export type DenoServer = {
    fetch(request: Request): UniversalFetchResult
}

export type BunServer = {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    fetch(request: Request, server: import('bun').Server<unknown>): UniversalFetchResult
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

export interface SimpleServerInterface {
    fetch(request: Request): Promise<Response>
}
