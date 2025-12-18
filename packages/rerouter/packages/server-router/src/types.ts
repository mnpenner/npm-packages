import type {UniversalExecutionContext} from './UniversalServerInterface'

export interface Route {
    name?: string | string[]
    pattern: string | URLPattern
    handler: Handler<any, any, any, any, any>
    method: string
}

export interface NormalizedRoute {
    name: string[]
    pattern: URLPattern
    handler: Handler<any, any, any, any, any>
    method: string
}

export type AnyContext = Record<string, any>

export type RequestContext<Ctx extends object = AnyContext> = {
    request: Request
    url: URL
    method: string
    headers: Headers
    pathParams: Record<string, string>
    queryParams: Record<string, string>
    body: unknown
    env: Record<string, unknown>
    executionCtx?: UniversalExecutionContext
    router: import('./router').Router<Ctx>
} & Ctx

export type Handler<TReqBody, TReqPath, TReqQuery, TOkRes, TErr = unknown> =
    (ctx: RequestContext & { body: TReqBody, pathParams: TReqPath, queryParams: TReqQuery }) => Promise<Response>

export type Middleware<Ctx extends object = AnyContext> =
    (ctx: RequestContext<Ctx>, next: () => Promise<Response>) => Response | Promise<Response>
