import type {Server} from 'bun'
import type {UniversalExecutionContext} from './UniversalServerInterface'
import {joinPrefixPathname, stripPrefixPathname} from './pathname'
import {normalizeRoute} from './route-normalize'
import type {AnyContext, Middleware, NormalizedRoute, RequestContext, Route} from './types'

type RouteEntry<Ctx extends object> =
    | { kind: 'route', route: NormalizedRoute }
    | { kind: 'router', prefix?: string, router: Router<Ctx> }

type MatchResult<Ctx extends object> = {
    route: NormalizedRoute
    match: URLPatternResult
    middleware: Middleware<Ctx>[]
}

export class Router<Ctx extends object = AnyContext> {
    private entries: RouteEntry<Ctx>[] = []
    private _middleware: Middleware<Ctx>[] = []

    constructor(middleware?: Middleware<Ctx> | Array<Middleware<Ctx> | null | undefined | false>) {
        if (middleware) {
            this.use(middleware as any)
        }
    }

    use(middleware: Middleware<Ctx> | Array<Middleware<Ctx> | null | undefined | false>): this
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

    mount(router: Router<Ctx>): this
    mount(prefix: string, router: Router<Ctx>): this
    mount(prefixOrRouter: string | Router<Ctx>, maybeRouter?: Router<Ctx>): this {
        if (typeof prefixOrRouter === 'string') {
            this.entries.push({ kind: 'router', prefix: prefixOrRouter, router: maybeRouter! })
        } else {
            this.entries.push({ kind: 'router', router: prefixOrRouter })
        }
        return this
    }

    add(route: Route): this {
        this.entries.push({ kind: 'route', route: normalizeRoute(route) })
        return this
    }

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
        for (const entry of this.entries) {
            if (entry.kind === 'route') {
                const route = entry.route
                if (route.method.toUpperCase() !== method) continue
                const match = route.pattern.exec(url)
                if (!match) continue
                return { route, match, middleware: [...this._middleware] }
            }

            if (entry.prefix) {
                const subPathname = stripPrefixPathname(entry.prefix, url.pathname)
                if (subPathname == null) continue
                const subUrl = new URL(url.toString())
                subUrl.pathname = subPathname
                const subMatch = entry.router.match(method, subUrl)
                if (!subMatch) continue
                return {
                    ...subMatch,
                    middleware: [...this._middleware, ...subMatch.middleware],
                }
            } else {
                const subMatch = entry.router.match(method, url)
                if (!subMatch) continue
                return {
                    ...subMatch,
                    middleware: [...this._middleware, ...subMatch.middleware],
                }
            }
        }
        return null
    }

    private async run(handler: (ctx: RequestContext<Ctx>) => Promise<Response>, middleware: Middleware<Ctx>[], ctx: RequestContext<Ctx>): Promise<Response> {
        let idx = -1
        const dispatch = async (i: number): Promise<Response> => {
            if (i <= idx) throw new Error('next() called multiple times')
            idx = i

            if (i === middleware.length) {
                return await Promise.resolve().then(() => handler(ctx))
            }

            const mw = middleware[i]
            return await Promise.resolve().then(() => mw!(ctx, () => dispatch(i + 1)))
        }

        return dispatch(0)
    }

    fetch(request: Request): Promise<Response>
    fetch(request: Request, server: Server<any>): Promise<Response>
    fetch(request: Request, env: Record<string, unknown>, ctx: UniversalExecutionContext): Promise<Response>
    async fetch(request: Request, a?: Record<string, unknown> | Server<any>, b?: UniversalExecutionContext): Promise<Response> {
        const env = (arguments.length >= 3 ? (a as Record<string, unknown>) : {}) ?? {}
        const executionCtx = arguments.length >= 3 ? b : undefined
        const url = new URL(request.url)
        const method = request.method.toUpperCase()

        const found = this.match(method, url)
        if (!found) {
            return new Response('Not Found', { status: 404 })
        }

        const pathParams = (found.match.pathname && (found.match as any).pathname.groups) || {}
        const queryParams = Object.fromEntries(url.searchParams.entries())

        const serverReq: RequestContext<Ctx> = {
            request,
            url,
            method,
            headers: request.headers,
            pathParams,
            queryParams,
            body: undefined,
            env,
            executionCtx,
            router: this,
        } as any

        try {
            const result = await this.run(found.route.handler as any, found.middleware, serverReq)
            return result
        } catch (_err) {
            return new Response('Internal Server Error', { status: 500 })
        }
    }
}
