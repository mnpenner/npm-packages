import type {HttpStatus} from '@mpen/http-helpers'

export type {HttpStatus} from '@mpen/http-helpers'

/**
 * Declarative route definition that the router can normalize and register.
 *
 * @example
 * ```ts
 * const route: Route = {
 *   name: 'user.detail',
 *   method: 'GET',
 *   pattern: '/users/:id',
 *   handler: async ({req}) => new Response(await req.text()),
 * }
 * ```
 */
export interface Route {
    name?: string | string[]
    pattern: string | URLPattern
    handler: Handler<any, any, any, any, any>
    method?: string | string[]
    /**
     * Expected media type for the incoming request body. When provided, the router compares it against
     * the incoming `Content-Type` header.
     *
     * @example
     * ```ts
     * const route: Route = {
     *   pattern: '/upload',
     *   method: 'POST',
     *   accept: 'multipart/form-data',
     *   handler: async () => new Response('ok'),
     * }
     * ```
     */
    accept?: string | MediaType
}

/**
 * Normalized route metadata used internally by the router.
 *
 * @example
 * ```ts
 * const route: NormalizedRoute = {
 *   name: ['user', 'detail'],
 *   method: 'GET',
 *   pattern: new URLPattern({pathname: '/users/:id'}),
 *   handler: async ({req}) => new Response(await req.text()),
 * }
 * ```
 */
export interface NormalizedRoute {
    name: string[]
    pattern: URLPattern
    handler: Handler<any, any, any, any, any>
    method?: string | string[]
    accept?: MediaType
}

/**
 * Media type descriptor parsed from a Content-Type or accept string.
 *
 * @example
 * ```ts
 * const media: MediaType = {type: 'application/json', charset: 'utf-8'}
 * ```
 */
export type MediaType = {
    type: string
    charset?: string
    boundary?: string
}

/**
 * Generic context dictionary used when no custom context type is provided.
 *
 * @example
 * ```ts
 * const ctx: AnyContext = {featureFlag: true}
 * ```
 */
export type AnyContext = Record<string, any>

/**
 * Request context made available to middleware.
 * Extended data can be attached by middleware via the generic parameter.
 *
 * @example
 * ```ts
 * const middleware: Middleware<{userId: string}> = async (ctx, next) => {
 *   ctx.userId = 'user-123'
 *   return await next()
 * }
 * ```
 */
export type RequestContext<Ctx extends object = AnyContext> = {
    /**
     * Primary request reference for handlers and middleware.
     */
    req: Request
} & Ctx

/**
 * Values yielded by streaming handlers to describe response metadata such as [`HttpStatus`]{@link HttpStatus}.
 *
 * @example
 * ```ts
 * async function* handler() {
 *   yield 201
 *   yield new Headers({'content-type': 'application/octet-stream'})
 *   yield {status: 202, headers: {'x-stream': 'true'}}
 *   yield 'chunk-1'
 *   yield new Uint8Array([1, 2, 3])
 *   return new Uint8Array([1, 2, 3])
 * }
 * ```
 */
export type HandlerYield =
    | number
    | HttpStatus
    | Headers
    | {status?: number | HttpStatus; headers?: HeadersInit}
    | Buffer
    | Uint8Array
    | string
    | undefined

/**
 * Final body value returned from streaming handlers.
 *
 * @example
 * ```ts
 * const body: HandlerBody = new Uint8Array([1, 2, 3])
 * const textBody: HandlerBody = 'ok'
 * ```
 */
export type HandlerBody = Buffer | Uint8Array | ReadableStream | string

/**
 * Allowed handler return values.
 *
 * @example
 * ```ts
 * const handler: Handler = async ({req}) => new Response(await req.text())
 * ```
 */
export type HandlerResult =
    | Response
    | HandlerBody
    | Promise<Response | HandlerBody>
    | AsyncGenerator<HandlerYield, HandlerBody>

/**
 * Route handler signature that preserves generic type parameters for API generation.
 *
 * @example
 * ```ts
 * const handler: Handler<unknown, {id: string}, unknown, string> = ({req}) => {
 *   return new Response(`id=${new URL(req.url).pathname}`)
 * }
 * ```
 *
 * @param ctx - Handler context containing the incoming [`Request`]{@link Request}.
 * @returns A response or streaming generator that yields response metadata.
 */
export type Handler<TReqBody, TReqPath, TReqQuery, TOkRes, TErr = unknown> =
    (ctx: { req: Request }) => HandlerResult

/**
 * Middleware that can intercept requests and responses.
 *
 * @example
 * ```ts
 * const middleware: Middleware = async (ctx, next) => {
 *   const response = await next()
 *   return response
 * }
 * ```
 *
 * @param ctx - Request context for the current request.
 * @param next - Invokes the next middleware or route handler.
 * @returns The response or handler result, optionally wrapped in a Promise.
 */
export type Middleware<Ctx extends object = AnyContext> =
    (ctx: RequestContext<Ctx>, next: () => Promise<HandlerResult>) => HandlerResult | Promise<HandlerResult>
