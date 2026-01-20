import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import type {SimpleServerInterface} from './UniversalServerInterface'
import {joinPrefixPathname, stripPrefixPathname} from './pathname'
import {normalizeRoute} from './route-normalize'
import {mediaTypeMatches, parseMediaType} from './lib/media-type'
import type {
    AnyContext,
    ContextMiddleware,
    Handler,
    HandlerBody,
    HandlerResult,
    HandlerContext,
    HandlerYield,
    MiddlewareList,
    NormalizedRoute,
    RequestContext,
    Route
} from './types'
import {simpleStatus} from './response/simple'

type RouteEntry =
    | { kind: 'route', route: NormalizedRoute<any> }
    | { kind: 'router', prefix?: string, router: Router<any> }

type MatchResult = {
    route: NormalizedRoute<any>
    match: URLPatternResult
    middleware: ContextMiddleware<any, any>[]
    router: Router<any>
}

type MiddlewareEntry<Ctx extends object> = ContextMiddleware<any, Ctx> | null | undefined | false

type AddedContextOf<Middleware> = Middleware extends ContextMiddleware<infer Added, any> ? Added : {}

type AddedContextFromList<List extends readonly unknown[]> = List extends readonly [infer First, ...infer Rest]
    ? AddedContextOf<First> & AddedContextFromList<Rest>
    : {}

function normalizeMiddlewareList<Ctx extends object>(
    middleware: ContextMiddleware<any, Ctx> | MiddlewareList<Ctx> | null | undefined | false
): ContextMiddleware<any, Ctx>[] {
    if (!middleware) return []
    if (Array.isArray(middleware)) {
        return middleware.filter(Boolean) as ContextMiddleware<any, Ctx>[]
    }
    return [middleware as ContextMiddleware<any, Ctx>]
}

/**
 * Router that matches requests against registered routes and executes middleware.
 *
 * @example
 * ```ts
 * const router = new Router()
 * router.add({method: HttpMethod.GET, pattern: '/', handler: async ({req}) => new Response(req.url)})
 * ```
 */
export class Router<Ctx extends object = AnyContext> implements SimpleServerInterface {
    private _entries: RouteEntry[] = []
    private _middleware: ContextMiddleware<any, any>[] = []
    private _notFoundHandler?: Handler<any, Record<string, string>, any, any, any, Ctx>
    private _methodNotAllowedHandler?: Handler<any, Record<string, string>, any, any, any, Ctx>
    private _notAcceptableHandler?: Handler<any, Record<string, string>, any, any, any, Ctx>
    private _internalErrorHandler?: Handler<any, Record<string, string>, any, any, any, Ctx>

    /**
     * Create a new router instance.
     */
    constructor() {}

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
    notFound(handler: Handler<any, Record<string, string>, any, any, any, Ctx>): this {
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
    methodNotAllowed(handler: Handler<any, Record<string, string>, any, any, any, Ctx>): this {
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
    notAcceptable(handler: Handler<any, Record<string, string>, any, any, any, Ctx>): this {
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
    internalError(handler: Handler<any, Record<string, string>, any, any, any, Ctx>): this {
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
    use<AddedCtx extends object>(middleware: ContextMiddleware<AddedCtx, Ctx> | null | undefined | false): Router<Ctx & AddedCtx>
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
    use<List extends readonly MiddlewareEntry<Ctx>[]>(middleware: List): Router<Ctx & AddedContextFromList<List>>
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
        router: Router<Ctx & AddedCtx>
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
        router: Router<Ctx & AddedContextFromList<List>>
    ): this
    use(
        middleware: ContextMiddleware<any, Ctx> | MiddlewareList<Ctx> | null | undefined | false,
        router?: Router<any>
    ): Router<any> {
        const list = normalizeMiddlewareList(middleware)
        if (router) {
            const group = new Router<Ctx>().use(list)
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
     *   groupRouter.add({pattern: '/items', handler: () => new Response('ok')})
     * })
     * ```
     *
     * @param middleware - Middleware or a list of middleware to apply to the group.
     * @param configure - Callback used to register routes on the grouped router.
     * @returns The router instance for chaining.
     */
    group<AddedCtx extends object>(
        middleware: ContextMiddleware<AddedCtx, Ctx> | null | undefined | false,
        configure: (router: Router<Ctx & AddedCtx>) => void
    ): this
    /**
     * Create a group of routes with additional middleware applied.
     *
     * @example
     * ```ts
     * router.group([auth(), logging()], groupRouter => {
     *   groupRouter.add({pattern: '/items', handler: () => new Response('ok')})
     * })
     * ```
     *
     * @param middleware - Middleware list to apply to the group.
     * @param configure - Callback used to register routes on the grouped router.
     * @returns The router instance for chaining.
     */
    group<List extends readonly MiddlewareEntry<Ctx>[]>(
        middleware: List,
        configure: (router: Router<Ctx & AddedContextFromList<List>>) => void
    ): this
    group(
        middleware: ContextMiddleware<any, Ctx> | MiddlewareList<Ctx> | null | undefined | false,
        configure: (router: Router<any>) => void
    ): this {
        const list = normalizeMiddlewareList(middleware)
        const group = new Router<Ctx>().use(list)
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
     * router.add({method: HttpMethod.POST, pattern: '/items', handler: ({req}) => new Response(req.url)})
     * ```
     *
     * @param route - Route definition to normalize and register.
     * @returns The router instance for chaining.
     */
    add(route: Route<Ctx>): this {
        this._entries.push({ kind: 'route', route: normalizeRoute(route) })
        return this
    }

    /**
     * Add a GET route definition to this router.
     *
     * @param pattern - URL pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    get(pattern: Route<Ctx>['pattern'], handler: Handler<any, any, any, any, any, Ctx>): this {
        return this.add({pattern, handler, method: HttpMethod.GET})
    }

    /**
     * Add a HEAD route definition to this router.
     *
     * @param pattern - URL pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    head(pattern: Route<Ctx>['pattern'], handler: Handler<any, any, any, any, any, Ctx>): this {
        return this.add({pattern, handler, method: HttpMethod.HEAD})
    }

    /**
     * Add a POST route definition to this router.
     *
     * @param pattern - URL pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    post(pattern: Route<Ctx>['pattern'], handler: Handler<any, any, any, any, any, Ctx>): this {
        return this.add({pattern, handler, method: HttpMethod.POST})
    }

    /**
     * Add a PUT route definition to this router.
     *
     * @param pattern - URL pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    put(pattern: Route<Ctx>['pattern'], handler: Handler<any, any, any, any, any, Ctx>): this {
        return this.add({pattern, handler, method: HttpMethod.PUT})
    }

    /**
     * Add a DELETE route definition to this router.
     *
     * @param pattern - URL pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    delete(pattern: Route<Ctx>['pattern'], handler: Handler<any, any, any, any, any, Ctx>): this {
        return this.add({pattern, handler, method: HttpMethod.DELETE})
    }

    /**
     * Add a PATCH route definition to this router.
     *
     * @param pattern - URL pattern to match.
     * @param handler - Handler invoked when the route matches.
     * @returns The router instance for chaining.
     */
    patch(pattern: Route<Ctx>['pattern'], handler: Handler<any, any, any, any, any, Ctx>): this {
        return this.add({pattern, handler, method: HttpMethod.PATCH})
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

                const pattern = new URLPattern({
                    pathname: joinPrefixPathname(entry.prefix, subRoute.pattern.pathname),
                })
                routes.push({
                    ...subRoute,
                    pattern,
                })
            }
        }
        return routes
    }

    private _match(method: HttpMethod, url: URL): MatchResult | 'not_allowed' | null {
        const isHead = method === HttpMethod.HEAD
        if (isHead) {
            const headOnly = this._matchWithMethodCheck(
                url,
                routeMethod => this._methodMatches(routeMethod, HttpMethod.HEAD)
            )
            if (headOnly.match) return headOnly.match
            const getOnly = this._matchWithMethodCheck(
                url,
                routeMethod => this._methodMatches(routeMethod, HttpMethod.GET)
            )
            if (getOnly.match) return getOnly.match
            if (headOnly.methodNotAllowed || getOnly.methodNotAllowed) return 'not_allowed'
            return null
        }
        const match = this._matchWithMethodCheck(url, routeMethod => this._methodMatches(routeMethod, method))
        if (match.match) return match.match
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
                    if (!entry.route.pattern.exec(currentUrl)) continue
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
        const remaining = [...methods].filter(method => !order.includes(method)).sort()
        return [...ordered, ...remaining].join(', ')
    }

    private _buildHandlerContext(
        request: Request,
        url: URL,
        pathParams: Record<string, string>
    ): HandlerContext<Record<string, string>, Ctx> {
        return {
            req: request,
            url,
            pathParams,
        } as HandlerContext<Record<string, string>, Ctx>
    }

    private async _executeHandler(
        handler: Handler<any, any, any, any, any, any>,
        middleware: ContextMiddleware<any, any>[],
        ctx: HandlerContext<any, any>,
        router: Router<any>,
        request: Request
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
        if (this._isBodyChunk(result) || result instanceof ReadableStream) {
            return new Response(this._toResponseBody(result))
        }
        return await Promise.resolve(result)
    }

    private async _tryCustomHandler(
        handler: Handler<any, any, any, any, any, any> | undefined,
        ctx: HandlerContext<any, any>,
        router: Router<any>,
        request: Request
    ): Promise<Response | null> {
        if (!handler) return null
        try {
            return await this._executeHandler(handler, [], ctx, router, request)
        } catch {
            return simpleStatus(HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    private async _handleNotFound(request: Request, url: URL): Promise<Response> {
        const ctx = this._buildHandlerContext(request, url, {})
        const custom = await this._tryCustomHandler(this._notFoundHandler, ctx, this, request)
        if (custom) return custom
        return simpleStatus(HttpStatus.NOT_FOUND)
    }

    private async _handleMethodNotAllowed(request: Request, url: URL): Promise<Response> {
        const ctx = this._buildHandlerContext(request, url, {})
        const custom = await this._tryCustomHandler(this._methodNotAllowedHandler, ctx, this, request)
        if (custom) return custom
        return simpleStatus(HttpStatus.METHOD_NOT_ALLOWED)
    }

    private async _handleInternalError(
        router: Router<any>,
        ctx: HandlerContext<any, any>,
        request: Request
    ): Promise<Response> {
        const custom = await this._tryCustomHandler(router._internalErrorHandler, ctx, router, request)
        if (custom) return custom
        return simpleStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    }

    private async _handleMatch(found: MatchResult, request: Request, url: URL): Promise<Response> {
        const rawPathParams = found.match.pathname.groups ?? {}
        const pathParams = Object.fromEntries(
            Object.entries(rawPathParams).filter(([, value]) => value !== undefined)
        ) as Record<string, string>
        const handlerCtx = this._buildHandlerContext(request, url, pathParams)

        if (found.route.accept && found.route.accept.length > 0) {
            const contentTypeHeader = request.headers.get('content-type')
            if (!contentTypeHeader) {
                const custom = await this._tryCustomHandler(
                    found.router._notAcceptableHandler,
                    handlerCtx,
                    found.router,
                    request
                )
                if (custom) return custom
                return simpleStatus(HttpStatus.NOT_ACCEPTABLE)
            }
            const contentType = parseMediaType(contentTypeHeader)
            if (!contentType || !found.route.accept.some(accept => mediaTypeMatches(accept, contentType))) {
                const custom = await this._tryCustomHandler(
                    found.router._notAcceptableHandler,
                    handlerCtx,
                    found.router,
                    request
                )
                if (custom) return custom
                return simpleStatus(HttpStatus.NOT_ACCEPTABLE)
            }
        }

        try {
            return await this._executeHandler(found.route.handler, found.middleware, handlerCtx, found.router, request)
        } catch {
            return await this._handleInternalError(found.router, handlerCtx, request)
        }
    }

    private _methodMatches(routeMethod: HttpMethod | HttpMethod[] | undefined, method: HttpMethod): boolean {
        if (!routeMethod) return true
        const normalized = Array.isArray(routeMethod) ? routeMethod : [routeMethod]
        return normalized.some(routeValue => routeValue === method)
    }

    private _matchWithMethodCheck(
        url: URL,
        methodCheck: (routeMethod?: HttpMethod | HttpMethod[]) => boolean
    ): {match: MatchResult | null; methodNotAllowed: boolean} {
        let methodNotAllowed = false
        for (const entry of this._entries) {
            if (entry.kind === 'route') {
                const route = entry.route
                const match = route.pattern.exec(url)
                if (!match) continue
                if (!methodCheck(route.method)) {
                    methodNotAllowed = true
                    continue
                }
                return { match: { route, match, middleware: [...this._middleware], router: this }, methodNotAllowed }
            }

            if (entry.prefix) {
                const subPathname = stripPrefixPathname(entry.prefix, url.pathname)
                if (subPathname == null) continue
                const subUrl = new URL(url.toString())
                subUrl.pathname = subPathname
                const subMatch = entry.router._matchWithMethodCheck(subUrl, methodCheck)
                if (subMatch.match) {
                    return {
                        match: {
                            ...subMatch.match,
                            middleware: [...this._middleware, ...subMatch.match.middleware],
                        },
                        methodNotAllowed,
                    }
                }
                if (subMatch.methodNotAllowed) methodNotAllowed = true
            } else {
                const subMatch = entry.router._matchWithMethodCheck(url, methodCheck)
                if (subMatch.match) {
                    return {
                        match: {
                            ...subMatch.match,
                            middleware: [...this._middleware, ...subMatch.match.middleware],
                        },
                        methodNotAllowed,
                    }
                }
                if (subMatch.methodNotAllowed) methodNotAllowed = true
            }
        }
        return { match: null, methodNotAllowed }
    }

    private _run(
        handler: Handler<any, any, any, any, any, any>,
        middleware: ContextMiddleware<any, any>[],
        ctx: HandlerContext<any, Ctx>,
        router: Router<any>
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


    private _isAsyncGenerator(value: unknown): value is AsyncGenerator<HandlerYield, HandlerBody> {
        return !!value && typeof (value as AsyncGenerator)[Symbol.asyncIterator] === 'function'
    }

    private async _closeGenerator(generator: AsyncGenerator<HandlerYield, HandlerBody>): Promise<void> {
        try {
            await generator.return?.(undefined as unknown as HandlerBody)
        } catch {
            // Ignore generator errors during teardown.
        }
    }

    private _toResponseBody(body: HandlerBody | null): BodyInit | null {
        if (body == null) return null
        if (body instanceof ReadableStream) return body
        if (typeof body === 'string') return body
        if (body instanceof Uint8Array) {
            const copy = new Uint8Array(body.byteLength)
            copy.set(body)
            return copy.buffer
        }
        return new Uint8Array(body).buffer
    }

    private _isBodyChunk(value: unknown): value is Uint8Array | string {
        return typeof value === 'string' || value instanceof Uint8Array
    }

    private _toBodyChunk(value: Uint8Array | string): Uint8Array {
        if (typeof value === 'string') {
            return new TextEncoder().encode(value)
        }
        return value
    }

    private async _responseFromGenerator(
        generator: AsyncGenerator<HandlerYield, HandlerBody>,
        request: Request
    ): Promise<Response | null> {
        const isHead = request.method.toUpperCase() === HttpMethod.HEAD
        let status: number | undefined
        let headers: Headers | undefined
        let bodyStream: ReadableStream<Uint8Array> | undefined
        let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined
        let responseResolved = false
        let resolveResponse: ((value: Response | null) => void) | undefined
        const responsePromise = new Promise<Response | null>(resolve => {
            resolveResponse = resolve
        })
        let abortListener: (() => void) | undefined
        const abortSignal = request.signal
        const abortPromise = abortSignal
            ? new Promise<'aborted'>(resolve => {
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

        const buildResponseInit = (): ResponseInit => {
            const responseInit: ResponseInit = {}
            if (status !== undefined) responseInit.status = status
            if (headers) responseInit.headers = headers
            return responseInit
        }

        const ensureStreamResponse = () => {
            if (responseResolved) return
            if (!bodyStream) {
                bodyStream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        bodyController = controller
                    },
                })
            }
            if (status === undefined) status = HttpStatus.OK
            resolveResponseOnce(new Response(bodyStream, buildResponseInit()))
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
                                if (!isHead && next.value != null) {
                                    if (this._isBodyChunk(next.value)) {
                                        bodyController?.enqueue(this._toBodyChunk(next.value))
                                    }
                                }
                                bodyController?.close()
                                if (!responseResolved) {
                                    resolveResponseOnce(new Response(bodyStream, buildResponseInit()))
                                }
                                return
                            }

                            const body = isHead ? null : (next.value ?? null)
                            resolveResponseOnce(new Response(this._toResponseBody(body), buildResponseInit()))
                            return
                        }

                        const yielded = next.value
                        if (typeof yielded === 'number') {
                            status = yielded
                            continue
                        }

                        if (yielded instanceof Headers) {
                            headers = yielded
                            if (status === undefined) {
                                status = HttpStatus.OK
                            }
                            if (isHead && status !== undefined && headers) {
                                await this._closeGenerator(generator)
                                resolveResponseOnce(new Response(null, { status, headers }))
                                return
                            }
                            if (!isHead) {
                                ensureStreamResponse()
                            }
                            continue
                        }

                        if (this._isBodyChunk(yielded)) {
                            if (isHead) {
                                continue
                            }
                            ensureStreamResponse()
                            bodyController?.enqueue(this._toBodyChunk(yielded))
                            continue
                        }

                        if (yielded && typeof yielded === 'object') {
                            const yieldedStatus =
                                'status' in yielded ? (yielded as {status?: number | undefined}).status : undefined
                            const yieldedHeaders =
                                'headers' in yielded ? (yielded as {headers?: HeadersInit | undefined}).headers : undefined
                            if (yieldedStatus !== undefined) {
                                status = yieldedStatus
                            }
                            if (yieldedHeaders !== undefined) {
                                headers = new Headers(yieldedHeaders)
                                if (status === undefined) {
                                    status = HttpStatus.OK
                                }
                                if (isHead && status !== undefined && headers) {
                                    await this._closeGenerator(generator)
                                    resolveResponseOnce(new Response(null, { status, headers }))
                                    return
                                }
                                if (!isHead) {
                                    ensureStreamResponse()
                                }
                            }
                        }
                    }
                } catch (err) {
                    bodyController?.error?.(err)
                    resolveResponseOnce(null)
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
            const explicit = this._match(method, url)
            if (explicit && explicit !== 'not_allowed') {
                return await this._handleMatch(explicit, request, url)
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
                headers: {'access-control-allow-methods': this._formatAllowMethods(allowedMethods)},
            })
        }

        const found = this._match(method, url)
        if (!found) {
            return await this._handleNotFound(request, url)
        }
        if (found === 'not_allowed') {
            return await this._handleMethodNotAllowed(request, url)
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
