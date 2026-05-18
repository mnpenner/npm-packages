import { CommonHeaders, HttpMethod, HttpStatus, StatusText } from '@mpen/http'
import { ConsoleLogger, type Logger } from '@mpen/logger'
import type { SimpleServerInterface } from './UniversalServerInterface'
import { joinPrefixPathname, stripPrefixPathname } from './pathname'
import { normalizeRoute } from './route-normalize'
import { mediaTypeMatches, parseAcceptHeader, parseMediaType } from './lib/media-type'
import type {
    AnyContext,
    ContextMiddleware,
    Handler,
    HandlerBody,
    HandlerFinalResult,
    HandlerResult,
    HandlerContext,
    HandlerYield,
    MiddlewareList,
    NormalizedRoute,
    RequestContext,
    Route,
    RouteOptions,
    RouterOptions,
} from './types'
import {
    isChunkDirective,
    isHeadersDirective,
    isHeadDirective,
    isResponseBodyInit,
    isRoutekitBody,
    isRoutekitResponse,
    isStatusDirective,
    isStreamDirective,
    jsonSerializer,
    response as routekitResponse,
    text,
    type BodySerializer,
    type RoutekitResponse,
    type StreamFramer,
} from './response'
import type { RouterBodyInit } from './fetch-types'

type RouteEntry =
    | { kind: 'route'; route: NormalizedRoute<any> }
    | { kind: 'router'; prefix?: string; router: Router<any> }

type MatchResult = {
    route: NormalizedRoute<any>
    match: URLPatternResult | null
    middleware: ContextMiddleware<any, any>[]
    router: Router<any>
}

type MatchAttempt = {
    match: MatchResult | null
    notAcceptable: MatchResult | null
    methodNotAllowed: boolean
}

type MiddlewareEntry<Ctx extends object> = ContextMiddleware<any, Ctx> | null | undefined | false

type AddedContextOf<Middleware> =
    Middleware extends ContextMiddleware<infer Added, any> ? Added : {}

type AddedContextFromList<List extends readonly unknown[]> = List extends readonly [
    infer First,
    ...infer Rest,
]
    ? AddedContextOf<First> & AddedContextFromList<Rest>
    : {}

type MethodRouteInput<Ctx extends object> = Handler<any, Ctx> | RouteOptions<Ctx>

function normalizeMiddlewareList<Ctx extends object>(
    middleware: ContextMiddleware<any, Ctx> | MiddlewareList<Ctx> | null | undefined | false,
): ContextMiddleware<any, Ctx>[] {
    if (!middleware) return []
    if (Array.isArray(middleware)) {
        return middleware.filter(Boolean) as ContextMiddleware<any, Ctx>[]
    }
    return [middleware as ContextMiddleware<any, Ctx>]
}

function isHandler<Ctx extends object>(input: MethodRouteInput<Ctx>): input is Handler<any, Ctx> {
    return typeof input === 'function'
}

/**
 * Router that matches requests against registered routes and executes middleware.
 *
 * @example
 * ```ts
 * const router = new Router()
 * router.add({method: HttpMethod.GET, path: '/', handler: async ({req}) => new Response(req.url)})
 * ```
 */
export class Router<Ctx extends object = AnyContext> implements SimpleServerInterface {
    private _entries: RouteEntry[] = []
    private _middleware: ContextMiddleware<any, any>[] = []
    private _serializers: BodySerializer[]
    private _logger: Logger
    private _notFoundHandler?: Handler<any, Ctx>
    private _methodNotAllowedHandler?: Handler<any, Ctx>
    private _notAcceptableHandler?: Handler<any, Ctx>
    private _internalErrorHandler?: Handler<any, Ctx>

    /**
     * Create a new router instance.
     *
     * @param options - Router configuration.
     */
    constructor(options: RouterOptions = {}) {
        this._serializers = options.serializers?.slice() ?? [jsonSerializer()]
        this._logger = options.logger ?? new ConsoleLogger()
    }

    /**
     * Register a handler for requests that do not match any route.
     *
     * @example
     * ```ts
     * router.notFound(() => new Response('missing', {status: 404}))
     * ```
     *
     * @param handler - Handler invoked when no route matches.
     * @returns The router instance for chaining.
     */
    notFound(handler: Handler<any, Ctx>): this {
        this._notFoundHandler = handler
        return this
    }

    /**
     * Register a handler for requests that match a path but use an unsupported method.
     *
     * @example
     * ```ts
     * router.methodNotAllowed(() => new Response('nope', {status: 405}))
     * ```
     *
     * @param handler - Handler invoked when a route exists but the method does not match.
     * @returns The router instance for chaining.
     */
    methodNotAllowed(handler: Handler<any, Ctx>): this {
        this._methodNotAllowedHandler = handler
        return this
    }

    /**
     * Register a handler for requests that fail the route `accept` check.
     *
     * @example
     * ```ts
     * router.notAcceptable(() => new Response('unsupported', {status: 406}))
     * ```
     *
     * @param handler - Handler invoked when the incoming `Content-Type` is not accepted.
     * @returns The router instance for chaining.
     */
    notAcceptable(handler: Handler<any, Ctx>): this {
        this._notAcceptableHandler = handler
        return this
    }

    /**
     * Register a handler for unhandled errors thrown by route handlers.
     *
     * @example
     * ```ts
     * router.internalError(() => new Response('oops', {status: 500}))
     * ```
     *
     * @param handler - Handler invoked when a route handler throws.
     * @returns The router instance for chaining.
     */
    internalError(handler: Handler<any, Ctx>): this {
        this._internalErrorHandler = handler
        return this
    }

    /**
     * Register middleware on the current router.
     *
     * @example
     * ```ts
     * router.use(async (ctx, next) => {
     *   return await next()
     * })
     * ```
     *
     * @param middleware - Middleware or a list of middleware to register.
     * @returns The router instance for chaining.
     */
    use<AddedCtx extends object>(
        middleware: ContextMiddleware<AddedCtx, Ctx> | null | undefined | false,
    ): Router<Ctx & AddedCtx>
    /**
     * Register middleware on the current router.
     *
     * @example
     * ```ts
     * router.use([auth(), logging()])
     * ```
     *
     * @param middleware - Middleware list to register.
     * @returns The router instance for chaining.
     */
    use<List extends readonly MiddlewareEntry<Ctx>[]>(
        middleware: List,
    ): Router<Ctx & AddedContextFromList<List>>
    /**
     * Register middleware and mount a router that uses it.
     *
     * @example
     * ```ts
     * const auth = async (_ctx, next) => next()
     * router.use(auth, otherRouter)
     * ```
     *
     * @param middleware - Middleware or a list of middleware to register.
     * @param router - Router to mount with the provided middleware.
     * @returns The router instance for chaining.
     */
    use<AddedCtx extends object>(
        middleware: ContextMiddleware<AddedCtx, Ctx> | null | undefined | false,
        router: Router<Ctx & AddedCtx>,
    ): this
    /**
     * Register middleware list and mount a router that uses it.
     *
     * @example
     * ```ts
     * router.use([auth(), logging()], otherRouter)
     * ```
     *
     * @param middleware - Middleware list to register.
     * @param router - Router to mount with the provided middleware.
     * @returns The router instance for chaining.
     */
    use<List extends readonly MiddlewareEntry<Ctx>[]>(
        middleware: List,
        router: Router<Ctx & AddedContextFromList<List>>,
    ): this
    use(
        middleware: ContextMiddleware<any, Ctx> | MiddlewareList<Ctx> | null | undefined | false,
        router?: Router<any>,
    ): Router<any> {
        const list = normalizeMiddlewareList(middleware)
        if (router) {
            const group = new Router<Ctx>({
                serializers: this._serializers,
                logger: this._logger,
            }).use(list)
            group.mount(router)
            this._entries.push({ kind: 'router', router: group })
            return this
        }
        this._middleware.push(...list)
        return this
    }

    /**
     * Create a group of routes with additional middleware applied.
     *
     * @example
     * ```ts
     * router.group([auth(), logging()], groupRouter => {
     *   groupRouter.add({path: '/items', handler: () => new Response('ok')})
     * })
     * ```
     *
     * @param middleware - Middleware or a list of middleware to apply to the group.
     * @param configure - Callback used to register routes on the grouped router.
     * @returns The router instance for chaining.
     */
    group<AddedCtx extends object>(
        middleware: ContextMiddleware<AddedCtx, Ctx> | null | undefined | false,
        configure: (router: Router<Ctx & AddedCtx>) => void,
    ): this
    /**
     * Create a group of routes with additional middleware applied.
     *
     * @example
     * ```ts
     * router.group([auth(), logging()], groupRouter => {
     *   groupRouter.add({path: '/items', handler: () => new Response('ok')})
     * })
     * ```
     *
     * @param middleware - Middleware list to apply to the group.
     * @param configure - Callback used to register routes on the grouped router.
     * @returns The router instance for chaining.
     */
    group<List extends readonly MiddlewareEntry<Ctx>[]>(
        middleware: List,
        configure: (router: Router<Ctx & AddedContextFromList<List>>) => void,
    ): this
    group(
        middleware: ContextMiddleware<any, Ctx> | MiddlewareList<Ctx> | null | undefined | false,
        configure: (router: Router<any>) => void,
    ): this {
        const list = normalizeMiddlewareList(middleware)
        const group = new Router<Ctx>({
            serializers: this._serializers,
            logger: this._logger,
        }).use(list)
        configure(group)
        this._entries.push({ kind: 'router', router: group })
        return this
    }

    /**
     * Mount a router at the current path.
     *
     * @example
     * ```ts
     * router.mount(apiRouter)
     * ```
     *
     * @param router - Router to mount.
     * @returns The router instance for chaining.
     */
    mount(router: Router<any>): this
    /**
     * Mount a router under a pathname prefix.
     *
     * @example
     * ```ts
     * router.mount('/api', apiRouter)
     * ```
     *
     * @param prefix - Pathname prefix to strip before routing.
     * @param router - Router to mount.
     * @returns The router instance for chaining.
     */
    mount(prefix: string, router: Router<any>): this
    mount(prefixOrRouter: string | Router<any>, maybeRouter?: Router<any>): this {
        if (typeof prefixOrRouter === 'string') {
            this._entries.push({ kind: 'router', prefix: prefixOrRouter, router: maybeRouter! })
        } else {
            this._entries.push({ kind: 'router', router: prefixOrRouter })
        }
        return this
    }

    /**
     * Add a route definition to this router.
     *
     * @example
     * ```ts
     * router.add({method: HttpMethod.POST, path: '/items', handler: ({req}) => new Response(req.url)})
     * ```
     *
     * @param route - Route definition to normalize and register.
     * @returns The router instance for chaining.
     */
    add(route: Route<Ctx>): this {
        this._entries.push({ kind: 'route', route: normalizeRoute(route) })
        return this
    }

    private _addMethod(
        method: HttpMethod,
        path: NonNullable<Route<Ctx>['path']>,
        input: MethodRouteInput<Ctx>,
    ): this {
        return this.add({
            ...(isHandler(input) ? { handler: input } : input),
            path,
            method,
        })
    }

    /**
     * Add a GET route handler to this router.
     *
     * @param path - URL path pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    get(path: NonNullable<Route<Ctx>['path']>, handler: Handler<any, Ctx>): this
    /**
     * Add a GET route definition to this router.
     *
     * @param path - URL path pattern to match.
     * @param options - Route options registered with the GET method.
     * @returns The router instance for chaining.
     */
    get(path: NonNullable<Route<Ctx>['path']>, options: RouteOptions<Ctx>): this
    get(path: NonNullable<Route<Ctx>['path']>, input: MethodRouteInput<Ctx>): this {
        return this._addMethod(HttpMethod.GET, path, input)
    }

    /**
     * Add a HEAD route handler to this router.
     *
     * @param path - URL path pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    head(path: NonNullable<Route<Ctx>['path']>, handler: Handler<any, Ctx>): this
    /**
     * Add a HEAD route definition to this router.
     *
     * @param path - URL path pattern to match.
     * @param options - Route options registered with the HEAD method.
     * @returns The router instance for chaining.
     */
    head(path: NonNullable<Route<Ctx>['path']>, options: RouteOptions<Ctx>): this
    head(path: NonNullable<Route<Ctx>['path']>, input: MethodRouteInput<Ctx>): this {
        return this._addMethod(HttpMethod.HEAD, path, input)
    }

    /**
     * Add a POST route handler to this router.
     *
     * @param path - URL path pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    post(path: NonNullable<Route<Ctx>['path']>, handler: Handler<any, Ctx>): this
    /**
     * Add a POST route definition to this router.
     *
     * @param path - URL path pattern to match.
     * @param options - Route options registered with the POST method.
     * @returns The router instance for chaining.
     */
    post(path: NonNullable<Route<Ctx>['path']>, options: RouteOptions<Ctx>): this
    post(path: NonNullable<Route<Ctx>['path']>, input: MethodRouteInput<Ctx>): this {
        return this._addMethod(HttpMethod.POST, path, input)
    }

    /**
     * Add a PUT route handler to this router.
     *
     * @param path - URL path pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    put(path: NonNullable<Route<Ctx>['path']>, handler: Handler<any, Ctx>): this
    /**
     * Add a PUT route definition to this router.
     *
     * @param path - URL path pattern to match.
     * @param options - Route options registered with the PUT method.
     * @returns The router instance for chaining.
     */
    put(path: NonNullable<Route<Ctx>['path']>, options: RouteOptions<Ctx>): this
    put(path: NonNullable<Route<Ctx>['path']>, input: MethodRouteInput<Ctx>): this {
        return this._addMethod(HttpMethod.PUT, path, input)
    }

    /**
     * Add a DELETE route handler to this router.
     *
     * @param path - URL path pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    delete(path: NonNullable<Route<Ctx>['path']>, handler: Handler<any, Ctx>): this
    /**
     * Add a DELETE route definition to this router.
     *
     * @param path - URL path pattern to match.
     * @param options - Route options registered with the DELETE method.
     * @returns The router instance for chaining.
     */
    delete(path: NonNullable<Route<Ctx>['path']>, options: RouteOptions<Ctx>): this
    delete(path: NonNullable<Route<Ctx>['path']>, input: MethodRouteInput<Ctx>): this {
        return this._addMethod(HttpMethod.DELETE, path, input)
    }

    /**
     * Add a PATCH route handler to this router.
     *
     * @param path - URL path pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    patch(path: NonNullable<Route<Ctx>['path']>, handler: Handler<any, Ctx>): this
    /**
     * Add a PATCH route definition to this router.
     *
     * @param path - URL path pattern to match.
     * @param options - Route options registered with the PATCH method.
     * @returns The router instance for chaining.
     */
    patch(path: NonNullable<Route<Ctx>['path']>, options: RouteOptions<Ctx>): this
    patch(path: NonNullable<Route<Ctx>['path']>, input: MethodRouteInput<Ctx>): this {
        return this._addMethod(HttpMethod.PATCH, path, input)
    }

    /**
     * Return a flattened list of registered routes.
     *
     * @example
     * ```ts
     * const routes = router.getRoutes()
     * ```
     *
     * @returns Array of normalized routes.
     */
    getRoutes(): NormalizedRoute<any>[] {
        const routes: NormalizedRoute<any>[] = []
        for (const entry of this._entries) {
            if (entry.kind === 'route') {
                routes.push(entry.route)
                continue
            }

            for (const subRoute of entry.router.getRoutes()) {
                if (!entry.prefix) {
                    routes.push(subRoute)
                    continue
                }

                const path = new URLPattern({
                    pathname: joinPrefixPathname(entry.prefix, subRoute.path.pathname),
                })
                routes.push({
                    ...subRoute,
                    path,
                })
            }
        }
        return routes
    }

    private _match(
        request: Request,
        method: HttpMethod,
        url: URL,
    ): MatchResult | 'not_allowed' | { kind: 'not_acceptable'; found: MatchResult } | null {
        const isHead = method === HttpMethod.HEAD
        if (isHead) {
            const headOnly = this._matchWithMethodCheck(request, url, (routeMethod) =>
                this._methodMatches(routeMethod, HttpMethod.HEAD),
            )
            if (headOnly.match) return headOnly.match
            const getOnly = this._matchWithMethodCheck(request, url, (routeMethod) =>
                this._methodMatches(routeMethod, HttpMethod.GET),
            )
            if (getOnly.match) return getOnly.match
            if (headOnly.notAcceptable)
                return { kind: 'not_acceptable', found: headOnly.notAcceptable }
            if (getOnly.notAcceptable)
                return { kind: 'not_acceptable', found: getOnly.notAcceptable }
            if (headOnly.methodNotAllowed || getOnly.methodNotAllowed) return 'not_allowed'
            return null
        }
        const match = this._matchWithMethodCheck(request, url, (routeMethod) =>
            this._methodMatches(routeMethod, method),
        )
        if (match.match) return match.match
        if (match.notAcceptable) return { kind: 'not_acceptable', found: match.notAcceptable }
        return match.methodNotAllowed ? 'not_allowed' : null
    }

    private _collectAllowedMethods(url: URL): Set<HttpMethod> {
        const methods = new Set<HttpMethod>()
        function addMethods(routeMethod?: HttpMethod | HttpMethod[]) {
            if (!routeMethod) return
            const normalized = Array.isArray(routeMethod) ? routeMethod : [routeMethod]
            for (const method of normalized) {
                methods.add(method)
            }
        }
        function visit(entries: RouteEntry[], currentUrl: URL) {
            for (const entry of entries) {
                if (entry.kind === 'route') {
                    if (entry.route.match) continue
                    if (!entry.route.path.exec(currentUrl)) continue
                    addMethods(entry.route.method)
                    continue
                }

                if (entry.prefix) {
                    const subPathname = stripPrefixPathname(entry.prefix, currentUrl.pathname)
                    if (subPathname == null) continue
                    const subUrl = new URL(currentUrl.toString())
                    subUrl.pathname = subPathname
                    visit(entry.router._entries, subUrl)
                } else {
                    visit(entry.router._entries, currentUrl)
                }
            }
        }
        visit(this._entries, url)
        return methods
    }

    private _acceptMatches(route: NormalizedRoute<any>, request: Request): boolean {
        if (!route.accept || route.accept.length === 0) return true
        const contentTypeHeader = request.headers.get('content-type')
        if (!contentTypeHeader) return false
        const contentType = parseMediaType(contentTypeHeader)
        if (!contentType) return false
        return route.accept.some((accept) => mediaTypeMatches(accept, contentType))
    }

    private _formatAllowMethods(methods: Set<HttpMethod>): string {
        const order = [
            HttpMethod.GET,
            HttpMethod.HEAD,
            HttpMethod.POST,
            HttpMethod.PUT,
            HttpMethod.PATCH,
            HttpMethod.DELETE,
            HttpMethod.OPTIONS,
        ]
        const ordered: HttpMethod[] = []
        for (const method of order) {
            if (methods.has(method)) ordered.push(method)
        }
        const remaining = [...methods].filter((method) => !order.includes(method)).sort()
        return [...ordered, ...remaining].join(', ')
    }

    private _buildHandlerContext(
        request: Request,
        url: URL,
        pathParams: Record<string, string>,
    ): HandlerContext<Ctx> {
        return {
            req: request,
            url,
            pathParams,
        } as HandlerContext<Ctx>
    }

    private async _executeHandler(
        handler: Handler<any, any>,
        middleware: ContextMiddleware<any, any>[],
        ctx: HandlerContext<any>,
        router: Router<any>,
        request: Request,
    ): Promise<Response> {
        const result = await this._run(handler, middleware, ctx, router)
        if (result instanceof Response) {
            return result
        }
        if (this._isAsyncGenerator(result)) {
            const response = await this._responseFromGenerator(result, request)
            if (response) return response
            return new Response(null, { status: HttpStatus.CLIENT_CLOSED_REQUEST })
        }
        return await this._finalizeResult(result, request)
    }

    private _statusResponse(status: HttpStatus, request?: Request): Response {
        const result = text(StatusText[status] ?? `HTTP Status ${status}`, { status })
        return new Response(
            request?.method.toUpperCase() === HttpMethod.HEAD ? null : (result.body as string),
            {
                status,
                headers: result.headers,
            },
        )
    }

    private _logInternalServerError(error: unknown, request: Request): void {
        try {
            this._logger.error('Routekit internal server error', error, {
                method: request.method,
                url: request.url,
            })
        } catch {
            // Logging must not change the response produced for an internal server error.
        }
    }

    private async _finalizeResult(result: HandlerFinalResult, request: Request): Promise<Response> {
        if (result instanceof Response) {
            return result
        }
        if (this._isAsyncGenerator(result)) {
            const response = await this._responseFromGenerator(result, request)
            if (response) return response
            return new Response(null, { status: HttpStatus.CLIENT_CLOSED_REQUEST })
        }
        if (isRoutekitResponse(result)) {
            return await this._responseFromRoutekitResponse(result, request)
        }
        if (isRoutekitBody(result)) {
            return await this._responseFromRoutekitResponse(routekitResponse(result.value), request)
        }
        if (isResponseBodyInit(result)) {
            return new Response(this._toResponseBody(result), {
                status: HttpStatus.OK,
            })
        }
        return await this._responseFromRoutekitResponse(routekitResponse(result), request)
    }

    private async _responseFromRoutekitResponse(
        result: RoutekitResponse,
        request: Request,
    ): Promise<Response> {
        const isHead = request.method.toUpperCase() === HttpMethod.HEAD
        const headers = new Headers(result.headers)
        const status = result.status

        if (headers.has(CommonHeaders.CONTENT_TYPE)) {
            if (!isResponseBodyInit(result.body)) {
                throw new TypeError(
                    'Routekit response has Content-Type set, so body must be a native Response body.',
                )
            }
            return new Response(isHead ? null : this._toResponseBody(result.body), {
                status,
                headers,
            })
        }

        if (result.body === undefined) {
            return new Response(null, { status, headers })
        }

        const serializer = this._selectSerializer(result.body, request)
        if (!serializer) {
            return this._statusResponse(HttpStatus.NOT_ACCEPTABLE, request)
        }
        headers.set(CommonHeaders.CONTENT_TYPE, serializer.mediaType)
        this._appendVary(headers, CommonHeaders.ACCEPT)

        return new Response(isHead ? null : await serializer.serializer.serialize(result.body), {
            status,
            headers,
        })
    }

    private _appendVary(headers: Headers, value: string): void {
        const current = headers.get(CommonHeaders.VARY)
        if (!current) {
            headers.set(CommonHeaders.VARY, value)
            return
        }
        const entries = current.split(',').map((entry) => entry.trim().toLowerCase())
        if (entries.includes(value.toLowerCase())) return
        headers.set(CommonHeaders.VARY, `${current}, ${value}`)
    }

    private _selectSerializer(
        body: unknown,
        request: Request,
    ): { serializer: BodySerializer; mediaType: string } | null {
        const accepted = parseAcceptHeader(request.headers.get(CommonHeaders.ACCEPT) ?? '*/*')
        const ranges = accepted.length ? accepted : parseAcceptHeader('*/*')
        for (const accept of ranges) {
            if (accept.q === 0) continue
            for (const serializer of this._serializers) {
                if (!serializer.canSerialize(body)) continue
                for (const mediaType of serializer.mediaTypes) {
                    if (this._mediaRangeAccepts(accept.type, mediaType)) {
                        return { serializer, mediaType }
                    }
                }
            }
        }
        return null
    }

    private _mediaRangeAccepts(range: string, mediaType: string): boolean {
        const normalizedRange = range.toLowerCase()
        const produced = parseMediaType(mediaType)
        if (!produced) return false
        const normalizedProduced = produced.type.toLowerCase()
        if (normalizedRange === '*/*') return true
        if (normalizedRange === normalizedProduced) return true
        const [rangeType, rangeSubtype] = normalizedRange.split('/', 2)
        const [producedType, producedSubtype] = normalizedProduced.split('/', 2)
        if (!rangeType || !rangeSubtype || !producedType || !producedSubtype) return false
        if (rangeSubtype === '*' && rangeType === producedType) return true
        if (rangeSubtype.startsWith('*+')) {
            return rangeType === producedType && producedSubtype.endsWith(rangeSubtype.slice(1))
        }
        return false
    }

    private async _tryCustomHandler(
        handler: Handler<any, any> | undefined,
        ctx: HandlerContext<any>,
        router: Router<any>,
        request: Request,
    ): Promise<Response | null> {
        if (!handler) return null
        try {
            return await this._executeHandler(handler, [], ctx, router, request)
        } catch (error) {
            router._logInternalServerError(error, request)
            return this._statusResponse(HttpStatus.INTERNAL_SERVER_ERROR, request)
        }
    }

    private async _handleNotFound(request: Request, url: URL): Promise<Response> {
        const ctx = this._buildHandlerContext(request, url, {})
        const custom = await this._tryCustomHandler(this._notFoundHandler, ctx, this, request)
        if (custom) return custom
        return this._statusResponse(HttpStatus.NOT_FOUND, request)
    }

    private async _handleMethodNotAllowed(request: Request, url: URL): Promise<Response> {
        const ctx = this._buildHandlerContext(request, url, {})
        const custom = await this._tryCustomHandler(
            this._methodNotAllowedHandler,
            ctx,
            this,
            request,
        )
        if (custom) return custom
        return this._statusResponse(HttpStatus.METHOD_NOT_ALLOWED, request)
    }

    private async _handleInternalError(
        router: Router<any>,
        ctx: HandlerContext<any>,
        request: Request,
        error: unknown,
    ): Promise<Response> {
        router._logInternalServerError(error, request)
        const custom = await this._tryCustomHandler(
            router._internalErrorHandler,
            ctx,
            router,
            request,
        )
        if (custom) return custom
        return this._statusResponse(HttpStatus.INTERNAL_SERVER_ERROR, request)
    }

    private async _handleNotAcceptable(
        found: MatchResult,
        request: Request,
        url: URL,
    ): Promise<Response> {
        const rawPathParams = found.match?.pathname.groups ?? {}
        const pathParams = Object.fromEntries(
            Object.entries(rawPathParams).filter(([, value]) => value !== undefined),
        ) as Record<string, string>
        const handlerCtx = this._buildHandlerContext(request, url, pathParams)
        const custom = await this._tryCustomHandler(
            found.router._notAcceptableHandler,
            handlerCtx,
            found.router,
            request,
        )
        if (custom) return custom
        return this._statusResponse(HttpStatus.NOT_ACCEPTABLE, request)
    }

    private async _handleMatch(found: MatchResult, request: Request, url: URL): Promise<Response> {
        const rawPathParams = found.match?.pathname.groups ?? {}
        const pathParams = Object.fromEntries(
            Object.entries(rawPathParams).filter(([, value]) => value !== undefined),
        ) as Record<string, string>
        const handlerCtx = this._buildHandlerContext(request, url, pathParams)

        try {
            return await this._executeHandler(
                found.route.handler,
                found.middleware,
                handlerCtx,
                found.router,
                request,
            )
        } catch (error) {
            return await this._handleInternalError(found.router, handlerCtx, request, error)
        }
    }

    private _methodMatches(
        routeMethod: HttpMethod | HttpMethod[] | undefined,
        method: HttpMethod,
    ): boolean {
        if (!routeMethod) return true
        const normalized = Array.isArray(routeMethod) ? routeMethod : [routeMethod]
        return normalized.some((routeValue) => routeValue === method)
    }

    private _matchWithMethodCheck(
        request: Request,
        url: URL,
        methodCheck: (routeMethod?: HttpMethod | HttpMethod[]) => boolean,
    ): MatchAttempt {
        let methodNotAllowed = false
        let notAcceptable: MatchResult | null = null
        for (const entry of this._entries) {
            if (entry.kind === 'route') {
                const route = entry.route
                const pathMatch = route.path.exec(url)
                if (route.match) {
                    if (!route.match(request)) continue
                    return {
                        match: {
                            route,
                            match: pathMatch,
                            middleware: [...this._middleware],
                            router: this,
                        },
                        notAcceptable,
                        methodNotAllowed,
                    }
                }
                if (!pathMatch) continue
                if (!methodCheck(route.method)) {
                    methodNotAllowed = true
                    continue
                }
                if (!this._acceptMatches(route, request)) {
                    notAcceptable ??= {
                        route,
                        match: pathMatch,
                        middleware: [...this._middleware],
                        router: this,
                    }
                    continue
                }
                return {
                    match: {
                        route,
                        match: pathMatch,
                        middleware: [...this._middleware],
                        router: this,
                    },
                    notAcceptable,
                    methodNotAllowed,
                }
            }

            if (entry.prefix) {
                const subPathname = stripPrefixPathname(entry.prefix, url.pathname)
                if (subPathname == null) continue
                const subUrl = new URL(url.toString())
                subUrl.pathname = subPathname
                const subMatch = entry.router._matchWithMethodCheck(request, subUrl, methodCheck)
                if (subMatch.match) {
                    return {
                        match: {
                            ...subMatch.match,
                            middleware: [...this._middleware, ...subMatch.match.middleware],
                        },
                        notAcceptable,
                        methodNotAllowed,
                    }
                }
                if (subMatch.notAcceptable && !notAcceptable) {
                    notAcceptable = {
                        ...subMatch.notAcceptable,
                        middleware: [...this._middleware, ...subMatch.notAcceptable.middleware],
                    }
                }
                if (subMatch.methodNotAllowed) methodNotAllowed = true
            } else {
                const subMatch = entry.router._matchWithMethodCheck(request, url, methodCheck)
                if (subMatch.match) {
                    return {
                        match: {
                            ...subMatch.match,
                            middleware: [...this._middleware, ...subMatch.match.middleware],
                        },
                        notAcceptable,
                        methodNotAllowed,
                    }
                }
                if (subMatch.notAcceptable && !notAcceptable) {
                    notAcceptable = {
                        ...subMatch.notAcceptable,
                        middleware: [...this._middleware, ...subMatch.notAcceptable.middleware],
                    }
                }
                if (subMatch.methodNotAllowed) methodNotAllowed = true
            }
        }
        return { match: null, notAcceptable, methodNotAllowed }
    }

    private _run(
        handler: Handler<any, any>,
        middleware: ContextMiddleware<any, any>[],
        ctx: HandlerContext<Ctx>,
        router: Router<any>,
    ): Promise<HandlerResult> {
        let idx = -1
        const dispatch = async (i: number): Promise<HandlerResult> => {
            if (i <= idx) throw new Error('next() called multiple times')
            idx = i

            if (i === middleware.length) {
                return await Promise.resolve().then(() => handler.call(router, ctx as any))
            }

            const mw = middleware[i]
            if (!mw) {
                return await dispatch(i + 1)
            }
            const result = await mw(ctx as RequestContext<any>, () => dispatch(i + 1))
            if (result === undefined && mw.length < 2) {
                return await dispatch(i + 1)
            }
            return result as HandlerResult
        }

        return dispatch(0)
    }

    private _isAsyncGenerator(
        value: unknown,
    ): value is AsyncGenerator<HandlerYield, HandlerFinalResult> {
        return !!value && typeof (value as AsyncGenerator)[Symbol.asyncIterator] === 'function'
    }

    private async _closeGenerator(
        generator: AsyncGenerator<HandlerYield, HandlerFinalResult>,
    ): Promise<void> {
        try {
            await generator.return?.(undefined as unknown as HandlerFinalResult)
        } catch {
            // Ignore generator errors during teardown.
        }
    }

    private _toResponseBody(body: HandlerBody | null): RouterBodyInit | null {
        if (body == null) return null
        return body
    }

    private _isBodyChunk(value: unknown): value is Uint8Array | Buffer | string {
        return typeof value === 'string' || value instanceof Uint8Array
    }

    private _toBodyChunk(value: Uint8Array | Buffer | string): Uint8Array {
        if (typeof value === 'string') {
            return new TextEncoder().encode(value)
        }
        return value
    }

    private _mergeHeaders(target: Headers, source: Headers): void {
        source.forEach((value, key) => target.set(key, value))
    }

    private async _frameChunk(
        value: unknown,
        framer: StreamFramer | undefined,
    ): Promise<Uint8Array> {
        if (!framer) {
            if (!this._isBodyChunk(value)) {
                throw new TypeError(
                    'Generator yielded a structured chunk without stream(). Use stream(sseFramer()) or yield raw string/bytes chunks.',
                )
            }
            return this._toBodyChunk(value)
        }
        if (framer.canFrame && !framer.canFrame(value)) {
            throw new TypeError('Stream framer cannot encode the yielded chunk.')
        }
        return this._toBodyChunk(await framer.frame(value as never))
    }

    private async _responseFromGenerator(
        generator: AsyncGenerator<HandlerYield, HandlerFinalResult>,
        request: Request,
    ): Promise<Response | null> {
        const isHead = request.method.toUpperCase() === HttpMethod.HEAD
        let status: number | HttpStatus | undefined
        let statusSet = false
        const headers = new Headers()
        let framer: StreamFramer | undefined
        let bodyStream: ReadableStream<Uint8Array> | undefined
        let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined
        let responseResolved = false
        let resolveResponse: ((value: Response | null) => void) | undefined
        let rejectResponse: ((reason?: unknown) => void) | undefined
        const responsePromise = new Promise<Response | null>((resolve, reject) => {
            resolveResponse = resolve
            rejectResponse = reject
        })
        let abortListener: (() => void) | undefined
        const abortSignal = request.signal
        const abortPromise = abortSignal
            ? new Promise<'aborted'>((resolve) => {
                  if (abortSignal.aborted) {
                      resolve('aborted')
                      return
                  }
                  abortListener = () => resolve('aborted')
                  abortSignal.addEventListener('abort', abortListener, { once: true })
              })
            : null

        if (abortSignal?.aborted) {
            await this._closeGenerator(generator)
            return null
        }

        const resolveResponseOnce = (response: Response | null) => {
            if (responseResolved) return
            responseResolved = true
            resolveResponse?.(response)
        }

        const rejectResponseOnce = (error: unknown) => {
            if (responseResolved) {
                bodyController?.error?.(error)
                return
            }
            responseResolved = true
            rejectResponse?.(error)
        }

        const buildResponseInit = (): ResponseInit => ({
            status: status ?? HttpStatus.OK,
            headers,
        })

        const ensureStreamResponse = () => {
            if (responseResolved) return
            if (!bodyStream) {
                bodyStream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        bodyController = controller
                    },
                })
            }
            resolveResponseOnce(new Response(bodyStream, buildResponseInit()))
        }

        const setStatus = (value: number | HttpStatus) => {
            if (bodyStream) {
                throw new TypeError('Generator cannot set status after streaming has started.')
            }
            if (statusSet) {
                throw new TypeError('Generator response status was already set.')
            }
            status = value
            statusSet = true
        }

        const mergeHeaders = (value: Headers) => {
            if (bodyStream) {
                throw new TypeError('Generator cannot set headers after streaming has started.')
            }
            this._mergeHeaders(headers, value)
        }

        const finalizeReturnedValue = async (value: HandlerFinalResult) => {
            if (isRoutekitResponse(value)) {
                if (statusSet) {
                    throw new TypeError(
                        'Generator returned a Routekit response after status was already set.',
                    )
                }
                const mergedHeaders = new Headers(headers)
                this._mergeHeaders(mergedHeaders, value.headers)
                return await this._responseFromRoutekitResponse(
                    routekitResponse(value.body, {
                        status: value.status,
                        headers: mergedHeaders,
                    }),
                    request,
                )
            }
            if (value instanceof Response) {
                if (statusSet || [...headers.keys()].length > 0) {
                    throw new TypeError(
                        'Generator returned a native Response after response metadata was already set.',
                    )
                }
                return value
            }
            const returnedBody = isRoutekitBody(value) ? value.value : value
            return await this._responseFromRoutekitResponse(
                routekitResponse(returnedBody, {
                    status: status ?? HttpStatus.OK,
                    headers,
                }),
                request,
            )
        }

        try {
            const pump = async () => {
                try {
                    while (true) {
                        const next = abortPromise
                            ? await Promise.race([generator.next(), abortPromise])
                            : await generator.next()
                        if (next === 'aborted') {
                            await this._closeGenerator(generator)
                            bodyController?.error?.(new Error('Request aborted'))
                            resolveResponseOnce(null)
                            return
                        }

                        if (next.done) {
                            if (bodyStream) {
                                if (next.value !== undefined) {
                                    throw new TypeError(
                                        'Generator cannot return a final body after yielding chunks.',
                                    )
                                }
                                if (framer?.close && !isHead) {
                                    const finalChunk = await framer.close()
                                    if (finalChunk !== undefined) {
                                        bodyController?.enqueue(this._toBodyChunk(finalChunk))
                                    }
                                }
                                bodyController?.close()
                                if (!responseResolved) {
                                    resolveResponseOnce(
                                        new Response(bodyStream, buildResponseInit()),
                                    )
                                }
                                return
                            }

                            resolveResponseOnce(await finalizeReturnedValue(next.value))
                            return
                        }

                        const yielded = next.value
                        if (yielded === undefined) {
                            continue
                        }

                        if (isStatusDirective(yielded)) {
                            setStatus(yielded.status)
                            continue
                        }

                        if (isHeadersDirective(yielded)) {
                            mergeHeaders(yielded.headers)
                            if (isHead) {
                                await this._closeGenerator(generator)
                                resolveResponseOnce(new Response(null, buildResponseInit()))
                                return
                            }
                            continue
                        }

                        if (isHeadDirective(yielded)) {
                            setStatus(yielded.status)
                            mergeHeaders(yielded.headers)
                            if (isHead) {
                                await this._closeGenerator(generator)
                                resolveResponseOnce(new Response(null, buildResponseInit()))
                                return
                            }
                            continue
                        }

                        if (isStreamDirective(yielded)) {
                            if (bodyStream) {
                                throw new TypeError(
                                    'Generator cannot select a stream framer after streaming has started.',
                                )
                            }
                            framer = yielded.framer
                            mergeHeaders(yielded.headers)
                            headers.set(CommonHeaders.CONTENT_TYPE, framer.contentType)
                            if (isHead) {
                                await this._closeGenerator(generator)
                                resolveResponseOnce(new Response(null, buildResponseInit()))
                                return
                            }
                            continue
                        }

                        if (isChunkDirective(yielded)) {
                            if (isHead) {
                                await this._closeGenerator(generator)
                                resolveResponseOnce(new Response(null, buildResponseInit()))
                                return
                            }
                            ensureStreamResponse()
                            bodyController?.enqueue(await this._frameChunk(yielded.value, framer))
                            continue
                        }

                        throw new TypeError(
                            'Generator yielded an unsupported value. Use status(), headers(), head(), stream(), or chunk().',
                        )
                    }
                } catch (err) {
                    rejectResponseOnce(err)
                }
            }

            void pump()
            return await responsePromise
        } finally {
            if (abortSignal && abortListener) {
                abortSignal.removeEventListener('abort', abortListener)
            }
        }
    }

    private async _handleRequest(request: Request): Promise<Response> {
        const url = new URL(request.url)
        const method = request.method.toUpperCase() as HttpMethod

        if (method === HttpMethod.OPTIONS) {
            const explicit = this._match(request, method, url)
            if (explicit && explicit !== 'not_allowed' && !('kind' in explicit)) {
                return await this._handleMatch(explicit, request, url)
            }
            if (
                explicit &&
                explicit !== 'not_allowed' &&
                'kind' in explicit &&
                explicit.kind === 'not_acceptable'
            ) {
                return await this._handleNotAcceptable(explicit.found, request, url)
            }
            const allowedMethods = this._collectAllowedMethods(url)
            if (allowedMethods.size === 0) {
                return await this._handleNotFound(request, url)
            }
            if (allowedMethods.has(HttpMethod.GET)) {
                allowedMethods.add(HttpMethod.HEAD)
            }
            allowedMethods.add(HttpMethod.OPTIONS)
            return new Response(null, {
                status: HttpStatus.NO_CONTENT,
                headers: {
                    'access-control-allow-methods': this._formatAllowMethods(allowedMethods),
                },
            })
        }

        const found = this._match(request, method, url)
        if (!found) {
            return await this._handleNotFound(request, url)
        }
        if (found === 'not_allowed') {
            return await this._handleMethodNotAllowed(request, url)
        }
        if ('kind' in found) {
            return await this._handleNotAcceptable(found.found, request, url)
        }
        return await this._handleMatch(found, request, url)
    }

    /**
     * Handle an incoming request by matching routes and executing middleware.
     *
     * @example
     * ```ts
     * const response = await router.fetch(new Request('https://example.com/'))
     * ```
     *
     * @param request - Incoming request to route.
     * @returns The response produced by the matched handler.
     */
    fetch = (request: Request): Promise<Response> => {
        // Use = syntax to force `this` binding so that Bun can execute the router directly
        return this._handleRequest(request)
    }
}
