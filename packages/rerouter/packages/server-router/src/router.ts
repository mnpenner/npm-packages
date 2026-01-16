import type {SimpleServerInterface} from './UniversalServerInterface'
import {joinPrefixPathname, stripPrefixPathname} from './pathname'
import {normalizeRoute} from './route-normalize'
import type {
    AnyContext,
    HandlerBody,
    HandlerResult,
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
}

/**
 * Router that matches requests against registered routes and executes middleware.
 *
 * @example
 * ```ts
 * const router = new Router()
 * router.add({method: 'GET', pattern: '/', handler: async ({req}) => new Response(req.url)})
 * ```
 */
export class Router<Ctx extends object = AnyContext> implements SimpleServerInterface {
    private entries: RouteEntry<Ctx>[] = []
    private _middleware: Middleware<Ctx>[] = []

    /**
     * Create a new router instance.
     *
     * @example
     * ```ts
     * const router = new Router()
     * ```
     *
     * @param middleware - Optional middleware or list of middleware.
     * @returns The created router instance.
     */
    constructor(middleware?: Middleware<Ctx> | Array<Middleware<Ctx> | null | undefined | false>) {
        if (middleware) {
            this.use(middleware as any)
        }
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
            const group = new Router<Ctx>(list)
            group.mount(router)
            this.entries.push({ kind: 'router', router: group })
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
            this.entries.push({ kind: 'router', prefix: prefixOrRouter, router: maybeRouter! })
        } else {
            this.entries.push({ kind: 'router', router: prefixOrRouter })
        }
        return this
    }

    /**
     * Add a route definition to this router.
     *
     * @example
     * ```ts
     * router.add({method: 'POST', pattern: '/items', handler: ({req}) => new Response(req.url)})
     * ```
     *
     * @param route - Route definition to normalize and register.
     * @returns The router instance for chaining.
     */
    add(route: Route): this {
        this.entries.push({ kind: 'route', route: normalizeRoute(route) })
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
        for (const entry of this.entries) {
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

    private match(method: string, url: URL): MatchResult<Ctx> | null {
        const isHead = method === 'HEAD'
        if (isHead) {
            const headOnly = this.matchWithMethodCheck(url, routeMethod => routeMethod?.toUpperCase() === 'HEAD')
            if (headOnly) return headOnly
            return this.matchWithMethodCheck(url, () => true)
        }
        return this.matchWithMethodCheck(url, routeMethod => !routeMethod || routeMethod.toUpperCase() === method)
    }

    private matchWithMethodCheck(
        url: URL,
        methodCheck: (routeMethod?: string) => boolean
    ): MatchResult<Ctx> | null {
        for (const entry of this.entries) {
            if (entry.kind === 'route') {
                const route = entry.route
                if (!methodCheck(route.method)) continue
                const match = route.pattern.exec(url)
                if (!match) continue
                return { route, match, middleware: [...this._middleware] }
            }

            if (entry.prefix) {
                const subPathname = stripPrefixPathname(entry.prefix, url.pathname)
                if (subPathname == null) continue
                const subUrl = new URL(url.toString())
                subUrl.pathname = subPathname
                const subMatch = entry.router.matchWithMethodCheck(subUrl, methodCheck)
                if (!subMatch) continue
                return {
                    ...subMatch,
                    middleware: [...this._middleware, ...subMatch.middleware],
                }
            } else {
                const subMatch = entry.router.matchWithMethodCheck(url, methodCheck)
                if (!subMatch) continue
                return {
                    ...subMatch,
                    middleware: [...this._middleware, ...subMatch.middleware],
                }
            }
        }
        return null
    }

    private async run(
        handler: (ctx: { req: Request }) => HandlerResult,
        middleware: Middleware<Ctx>[],
        ctx: RequestContext<Ctx>
    ): Promise<HandlerResult> {
        let idx = -1
        const dispatch = async (i: number): Promise<HandlerResult> => {
            if (i <= idx) throw new Error('next() called multiple times')
            idx = i

            if (i === middleware.length) {
                return await Promise.resolve().then(() => handler({ req: ctx.req }))
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
        return new Uint8Array(body)
    }

    private async responseFromGenerator(
        generator: AsyncGenerator<HandlerYield, HandlerBody>,
        request: Request
    ): Promise<Response | null> {
        const isHead = request.method.toUpperCase() === 'HEAD'
        let status: number | undefined
        let headers: Headers | undefined
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

        try {
            while (true) {
                const next = abortPromise
                    ? await Promise.race([generator.next(), abortPromise])
                    : await generator.next()
                if (next === 'aborted') {
                    await this.closeGenerator(generator)
                    return null
                }

                if (next.done) {
                    const responseInit: ResponseInit = {}
                    if (status !== undefined) responseInit.status = status
                    if (headers) responseInit.headers = headers
                    const body = isHead ? null : (next.value ?? null)
                    return new Response(this.toResponseBody(body), responseInit)
                }

                const yielded = next.value
                if (typeof yielded === 'number') {
                    status = yielded
                } else if (yielded instanceof Headers) {
                    headers = yielded
                    if (status === undefined) {
                        status = 200
                    }
                }

                if (isHead && status !== undefined && headers) {
                    await this.closeGenerator(generator)
                    return new Response(null, { status, headers })
                }
            }
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
        const method = request.method.toUpperCase()

        const found = this.match(method, url)
        if (!found) {
            return new Response('Not Found', { status: 404 })
        }

        const serverReq: RequestContext<Ctx> = {
            req: request,
        } as any

        try {
            const result = await this.run(found.route.handler as any, found.middleware, serverReq)
            if (result instanceof Response) {
                return result
            }
            if (this.isAsyncGenerator(result)) {
                const response = await this.responseFromGenerator(result, request)
                if (response) return response
                return new Response(null, { status: 499 })
            }
            return await Promise.resolve(result)
        } catch (_err) {
            return new Response('Internal Server Error', { status: 500 })
        }
    }
}
