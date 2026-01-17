import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import type {SimpleServerInterface} from './UniversalServerInterface'
import {joinPrefixPathname, stripPrefixPathname} from './pathname'
import {normalizeRoute} from './route-normalize'
import {mediaTypeMatches, parseMediaType} from './lib/media-type'
import type {
    AnyContext,
    Handler,
    HandlerBody,
    HandlerResult,
    HandlerContext,
    HandlerYield,
    Middleware,
    NormalizedRoute,
    RequestContext,
    Route
} from './types'

type RouteEntry<Ctx extends object> =
    | { kind: 'route', route: NormalizedRoute }
    | { kind: 'router', prefix?: string, router: Router<Ctx> }

type MatchResult<Ctx extends object> = {
    route: NormalizedRoute
    match: URLPatternResult
    middleware: Middleware<Ctx>[]
    router: Router<Ctx>
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
    private _entries: RouteEntry<Ctx>[] = []
    private _middleware: Middleware<Ctx>[] = []

    /**
     * Create a new router instance.
     */
    constructor() {

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
    use(middleware: Middleware<Ctx> | Array<Middleware<Ctx> | null | undefined | false>): this
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
    use(middleware: Middleware<Ctx> | Array<Middleware<Ctx> | null | undefined | false>, router: Router<Ctx>): this
    use(
        middleware: Middleware<Ctx> | Array<Middleware<Ctx> | null | undefined | false>,
        router?: Router<Ctx>
    ): this {
        const list = Array.isArray(middleware) ? middleware.filter(Boolean) as Middleware<Ctx>[] : [middleware]
        if (router) {
            const group = new Router<Ctx>()
            group.use(list)
            group.mount(router)
            this._entries.push({ kind: 'router', router: group })
            return this
        }
        this._middleware.push(...list)
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
    mount(router: Router<Ctx>): this
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
    mount(prefix: string, router: Router<Ctx>): this
    mount(prefixOrRouter: string | Router<Ctx>, maybeRouter?: Router<Ctx>): this {
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
    add(route: Route): this {
        this._entries.push({ kind: 'route', route: normalizeRoute(route) })
        return this
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
    getRoutes(): NormalizedRoute[] {
        const routes: NormalizedRoute[] = []
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

    private match(method: HttpMethod, url: URL): MatchResult<Ctx> | 'not_allowed' | null {
        const isHead = method === HttpMethod.HEAD
        if (isHead) {
            const headOnly = this.matchWithMethodCheck(
                url,
                routeMethod => this.methodMatches(routeMethod, HttpMethod.HEAD)
            )
            if (headOnly.match) return headOnly.match
            const getOnly = this.matchWithMethodCheck(
                url,
                routeMethod => this.methodMatches(routeMethod, HttpMethod.GET)
            )
            if (getOnly.match) return getOnly.match
            if (headOnly.methodNotAllowed || getOnly.methodNotAllowed) return 'not_allowed'
            return null
        }
        const match = this.matchWithMethodCheck(url, routeMethod => this.methodMatches(routeMethod, method))
        if (match.match) return match.match
        return match.methodNotAllowed ? 'not_allowed' : null
    }

    private collectAllowedMethods(url: URL): Set<HttpMethod> {
        const methods = new Set<HttpMethod>()
        function addMethods(routeMethod?: HttpMethod | HttpMethod[]) {
            if (!routeMethod) return
            const normalized = Array.isArray(routeMethod) ? routeMethod : [routeMethod]
            for (const method of normalized) {
                methods.add(method)
            }
        }
        function visit(entries: RouteEntry<Ctx>[], currentUrl: URL) {
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

    private formatAllowMethods(methods: Set<HttpMethod>): string {
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

    private async handleMatch(found: MatchResult<Ctx>, request: Request, url: URL): Promise<Response> {
        if (found.route.accept && found.route.accept.length > 0) {
            const contentTypeHeader = request.headers.get('content-type')
            if (!contentTypeHeader) {
                return new Response('Not Acceptable', { status: HttpStatus.NOT_ACCEPTABLE })
            }
            const contentType = parseMediaType(contentTypeHeader)
            if (!contentType || !found.route.accept.some(accept => mediaTypeMatches(accept, contentType))) {
                return new Response('Not Acceptable', { status: HttpStatus.NOT_ACCEPTABLE })
            }
        }

        const serverReq: RequestContext<Ctx> = {
            req: request,
        } as any
        const rawPathParams = found.match.pathname.groups ?? {}
        const pathParams = Object.fromEntries(
            Object.entries(rawPathParams).filter(([, value]) => value !== undefined)
        ) as Record<string, string>
        const handlerCtx: HandlerContext<Record<string, string>> = {
            req: request,
            url,
            pathParams,
        }

        try {
            const result = await this.run(found.route.handler, found.middleware, serverReq, handlerCtx, found.router)
            if (result instanceof Response) {
                return result
            }
            if (this.isAsyncGenerator(result)) {
                const response = await this.responseFromGenerator(result, request)
                if (response) return response
                return new Response(null, { status: HttpStatus.CLIENT_CLOSED_REQUEST })
            }
            if (this.isBodyChunk(result) || result instanceof ReadableStream) {
                return new Response(this.toResponseBody(result))
            }
            return await Promise.resolve(result)
        } catch (_err) {
            return new Response('Internal Server Error', { status: HttpStatus.INTERNAL_SERVER_ERROR })
        }
    }

    private methodMatches(routeMethod: HttpMethod | HttpMethod[] | undefined, method: HttpMethod): boolean {
        if (!routeMethod) return true
        const normalized = Array.isArray(routeMethod) ? routeMethod : [routeMethod]
        return normalized.some(routeValue => routeValue === method)
    }

    private matchWithMethodCheck(
        url: URL,
        methodCheck: (routeMethod?: HttpMethod | HttpMethod[]) => boolean
    ): {match: MatchResult<Ctx> | null; methodNotAllowed: boolean} {
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
                const subMatch = entry.router.matchWithMethodCheck(subUrl, methodCheck)
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
                const subMatch = entry.router.matchWithMethodCheck(url, methodCheck)
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

    private async run(
        handler: Handler<any, any, any, any, any>,
        middleware: Middleware<Ctx>[],
        ctx: RequestContext<Ctx>,
        handlerCtx: HandlerContext<any>,
        router: Router<Ctx>
    ): Promise<HandlerResult> {
        let idx = -1
        const dispatch = async (i: number): Promise<HandlerResult> => {
            if (i <= idx) throw new Error('next() called multiple times')
            idx = i

            if (i === middleware.length) {
                return await Promise.resolve().then(() => handler.call(router, handlerCtx))
            }

            const mw = middleware[i]
            return await Promise.resolve().then(() => mw!(ctx, () => dispatch(i + 1)))
        }

        return dispatch(0)
    }


    private isAsyncGenerator(value: unknown): value is AsyncGenerator<HandlerYield, HandlerBody> {
        return !!value && typeof (value as AsyncGenerator)[Symbol.asyncIterator] === 'function'
    }

    private async closeGenerator(generator: AsyncGenerator<HandlerYield, HandlerBody>): Promise<void> {
        try {
            await generator.return?.(undefined as unknown as HandlerBody)
        } catch {
            // Ignore generator errors during teardown.
        }
    }

    private toResponseBody(body: HandlerBody | null): BodyInit | null {
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

    private isBodyChunk(value: unknown): value is Uint8Array | string {
        return typeof value === 'string' || value instanceof Uint8Array
    }

    private toBodyChunk(value: Uint8Array | string): Uint8Array {
        if (typeof value === 'string') {
            return new TextEncoder().encode(value)
        }
        return value
    }

    private async responseFromGenerator(
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
            await this.closeGenerator(generator)
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
                            await this.closeGenerator(generator)
                            bodyController?.error?.(new Error('Request aborted'))
                            resolveResponseOnce(null)
                            return
                        }

                        if (next.done) {
                            if (bodyStream) {
                                if (!isHead && next.value != null) {
                                    if (this.isBodyChunk(next.value)) {
                                        bodyController?.enqueue(this.toBodyChunk(next.value))
                                    }
                                }
                                bodyController?.close()
                                if (!responseResolved) {
                                    resolveResponseOnce(new Response(bodyStream, buildResponseInit()))
                                }
                                return
                            }

                            const body = isHead ? null : (next.value ?? null)
                            resolveResponseOnce(new Response(this.toResponseBody(body), buildResponseInit()))
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
                                await this.closeGenerator(generator)
                                resolveResponseOnce(new Response(null, { status, headers }))
                                return
                            }
                            if (!isHead) {
                                ensureStreamResponse()
                            }
                            continue
                        }

                        if (this.isBodyChunk(yielded)) {
                            if (isHead) {
                                continue
                            }
                            ensureStreamResponse()
                            bodyController?.enqueue(this.toBodyChunk(yielded))
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
                                    await this.closeGenerator(generator)
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
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url)
        const method = request.method.toUpperCase() as HttpMethod

        if (method === HttpMethod.OPTIONS) {
            const explicit = this.match(method, url)
            if (explicit && explicit !== 'not_allowed') {
                return await this.handleMatch(explicit, request, url)
            }
            const allowedMethods = this.collectAllowedMethods(url)
            if (allowedMethods.size === 0) {
                return new Response('Not Found', { status: HttpStatus.NOT_FOUND })
            }
            if (allowedMethods.has(HttpMethod.GET)) {
                allowedMethods.add(HttpMethod.HEAD)
            }
            allowedMethods.add(HttpMethod.OPTIONS)
            return new Response(null, {
                status: HttpStatus.NO_CONTENT,
                headers: {'access-control-allow-methods': this.formatAllowMethods(allowedMethods)},
            })
        }

        const found = this.match(method, url)
        if (!found) {
            return new Response('Not Found', { status: HttpStatus.NOT_FOUND })
        }
        if (found === 'not_allowed') {
            return new Response('Method Not Allowed', { status: HttpStatus.METHOD_NOT_ALLOWED })
        }
        return await this.handleMatch(found, request, url)
    }
}
