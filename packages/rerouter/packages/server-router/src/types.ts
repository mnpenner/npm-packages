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
    method: string
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
    method: string
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
 *   return new Uint8Array([1, 2, 3])
 * }
 * ```
 */
export type HandlerYield = number | HttpStatus | Headers

/**
 * Final body value returned from streaming handlers.
 *
 * @example
 * ```ts
 * const body: HandlerBody = new Uint8Array([1, 2, 3])
 * ```
 */
export type HandlerBody = Buffer | Uint8Array | ReadableStream

/**
 * Allowed handler return values.
 *
 * @example
 * ```ts
 * const handler: Handler = async ({req}) => new Response(await req.text())
 * ```
 */
export type HandlerResult = Response | Promise<Response> | AsyncGenerator<HandlerYield, HandlerBody>

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
 * @returns The response or handler result.
 */
export type Middleware<Ctx extends object = AnyContext> =
    (ctx: RequestContext<Ctx>, next: () => Promise<HandlerResult>) => HandlerResult
