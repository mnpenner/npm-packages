import type {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import type {Router} from './router'

export type OneOrMany<T> = T | T[]

/**
 * Route metadata used by tooling like OpenAPI generation.
 */
export interface RouteMeta {
    /**
     * OpenAPI operation metadata for this route.
     */
    openapi?: Record<string, unknown>
    [key: string]: unknown
}

/**
 * Declarative route definition that the router can normalize and register.
 *
 * @example
 * ```ts
 * const route: Route = {
 *   name: 'user.detail',
 *   method: HttpMethod.GET,
 *   pattern: '/users/:id',
 *   handler: async ({req}) => new Response(await req.text()),
 * }
 * ```
 */
export interface Route<Ctx extends object = AnyContext> {
    name?: OneOrMany<string>
    pattern: string | URLPattern
    handler: Handler<any, any, any, any, any, Ctx>
    method?: OneOrMany<HttpMethod>
    /**
     * Arbitrary metadata attached to the route.
     *
     * @example
     * ```ts
     * const route: Route = {
     *   pattern: '/pets',
     *   method: HttpMethod.GET,
     *   meta: {
     *     openapi: {
     *       description: 'Returns all pets from the system that the user has access to',
     *       responses: {
     *         200: {description: 'A list of pets'},
     *       },
     *     },
     *   },
     *   handler: () => new Response('ok'),
     * }
     * ```
     */
    meta?: RouteMeta
    /**
     * Expected media type(s) for the incoming request body. When provided, the router compares each
     * entry against the incoming `Content-Type` header.
     *
     * @example
     * ```ts
     * const route: Route = {
     *   pattern: '/upload',
     *   method: HttpMethod.POST,
     *   accept: ['multipart/form-data', {type: 'application/json'}],
     *   handler: async () => new Response('ok'),
     * }
     * ```
     */
    accept?: OneOrMany<string | MediaType>
}

/**
 * Normalized route metadata used internally by the router.
 *
 * @example
 * ```ts
 * const route: NormalizedRoute = {
 *   name: ['user', 'detail'],
 *   method: HttpMethod.GET,
 *   pattern: new URLPattern({pathname: '/users/:id'}),
 *   handler: async ({req}) => new Response(await req.text()),
 * }
 * ```
 */
export interface NormalizedRoute<Ctx extends object = AnyContext> {
    name: string[]
    pattern: URLPattern
    handler: Handler<any, any, any, any, any, Ctx>
    method?: HttpMethod | HttpMethod[]
    accept?: MediaType[]
    meta?: RouteMeta
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
 * Context object provided to route handlers.
 * Includes request metadata as well as any context extensions added by middleware.
 *
 * @example
 * ```ts
 * const handler: HandlerContext<{id: string}> = {
 *   req: new Request('https://example.com/users/123'),
 *   url: new URL('https://example.com/users/123'),
 *   pathParams: {id: '123'},
 * }
 * ```
 */
export type HandlerContext<TReqPath = unknown, Ctx extends object = AnyContext> = RequestContext<Ctx> & {
    /**
     * Parsed request URL for convenience.
     */
    url: URL
    /**
     * Route path parameters extracted from the matched URL pattern.
     */
    pathParams: TReqPath
}

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
 * Response type that preserves the expected JSON payload type.
 *
 * @example
 * ```ts
 * const response: ResponseWithData<{ok: true}> = new Response('{"ok":true}')
 * ```
 */
export type ResponseWithData<TJson> = Omit<Response, 'json'> & { json(): Promise<TJson> }

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
export type HandlerResult<TOkRes = unknown> =
    | ResponseWithData<TOkRes>
    | HandlerBody
    | Promise<ResponseWithData<TOkRes> | HandlerBody | AsyncGenerator<HandlerYield, HandlerBody>>
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
 * The handler is invoked with `this` bound to the active [`Router`]{@link Router}.
 *
 * @param ctx - Handler context containing the incoming [`Request`]{@link Request}, parsed [`URL`]{@link URL}, path parameters, and middleware extensions.
 * @returns A response or streaming generator that yields response metadata.
 */
export type Handler<
    TReqBody=unknown,
    TReqPath=unknown,
    TReqQuery=unknown,
    TOkRes=unknown,
    TErr = unknown,
    Ctx extends object = AnyContext,
> = (this: Router<any>, ctx: HandlerContext<TReqPath, Ctx>) => HandlerResult<TOkRes>

/**
 * Middleware that can intercept requests, responses, and extend context.
 *
 * @example
 * ```ts
 * const addRequestId = (): ContextMiddleware<{requestId: number}> => ctx => {
 *   ctx.requestId = 123
 * }
 * ```
 *
 * @param ctx - Request context for the current request, including any added fields.
 * @param next - Invokes the next middleware or route handler.
 * @returns The response or handler result, optionally wrapped in a Promise.
 */
export type ContextMiddleware<AddedCtx extends object = AnyContext, Ctx extends object = AnyContext> =
    (ctx: RequestContext<Ctx & AddedCtx>, next: () => Promise<HandlerResult>) =>
        | HandlerResult
        | Promise<HandlerResult>
        | void
        | Promise<void>

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
export type Middleware<Ctx extends object = AnyContext> = ContextMiddleware<{}, Ctx>

/**
 * Middleware list container for registering multiple middleware entries.
 *
 * @example
 * ```ts
 * const middleware: MiddlewareList = [auth(), logging()]
 * ```
 *
 * @param list - Collection of middleware entries, optionally including falsy values.
 * @returns A list of middleware compatible with `Router.use`.
 */
export type MiddlewareList<Ctx extends object = AnyContext> =
    ReadonlyArray<ContextMiddleware<any, Ctx> | null | undefined | false>
