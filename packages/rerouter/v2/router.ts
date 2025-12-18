import {URLPattern} from 'urlpattern-polyfill'
import type {ExecutionContext, FetchHandler} from './fetch-handler'

export interface Route {
    name?: string|string[]
    pattern: string|URLPattern
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
    executionCtx?: ExecutionContext
    router: Router<Ctx>
} & Ctx

export type Handler<TReqBody, TReqPath, TReqQuery, TOkRes, TErr = unknown> =
    (ctx: RequestContext & { body: TReqBody, pathParams: TReqPath, queryParams: TReqQuery }) => Promise<Response>

export type Middleware<Ctx extends object = AnyContext> =
    (ctx: RequestContext<Ctx>, next: () => Promise<Response>) => Response | Promise<Response>

function sanitizeNamePart(part: string): string {
    const replaced = part.replace(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '$$$1')
    const cleaned = replaced.replace(/[^a-zA-Z0-9_$]/g, '')
    if (cleaned.length === 0) return 'index'
    if (!/^[a-zA-Z_$]/.test(cleaned)) return '_' + cleaned
    return cleaned
}

export function sanitizeNameParts(parts: string[]): string[] {
    return parts.map(sanitizeNamePart).filter(Boolean)
}

export function splitNameString(name: string): string[] {
    const parts: string[] = []
    let current = ''
    let escaping = false

    for (const char of name) {
        if (escaping) {
            current += char
            escaping = false
            continue
        }
        if (char === '\\') {
            escaping = true
            continue
        }
        if (char === '.') {
            parts.push(current)
            current = ''
            continue
        }
        current += char
    }
    parts.push(current)

    return parts.filter(p => p.length > 0)
}

function upperFirst(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function lowerFirst(str: string): string {
    return str.slice(0, 1).toLowerCase() + str.slice(1)
}

function segmentToDefaultName(segment: string): string {
    const paramMatch = segment.match(/^:([a-zA-Z0-9_]+)(?:\(.+)?$/)
    if (paramMatch) {
        return 'By' + upperFirst(paramMatch[1])
    }

    const cleaned = segment.split(/[^a-zA-Z0-9]+/).filter(Boolean)
    if (cleaned.length === 0) return 'Index'
    return cleaned.map(upperFirst).join('')
}

export function pattToName(_method: string, patt: URLPattern): string[] {
    const pathname = patt.pathname
    const parts = pathname.split('/').filter(p => p.length > 0)

    if (parts.length === 0) {
        return []
    }

    const combined = parts.map(segmentToDefaultName).join('')
    return sanitizeNameParts([lowerFirst(combined)])
}

function normalizeRouteName(name: Route['name'], method: string, pattern: URLPattern): string[] {
    if (!name) {
        return pattToName(method, pattern)
    }
    if (typeof name === 'string') {
        return sanitizeNameParts(splitNameString(name))
    }
    return sanitizeNameParts(name)
}

export function normalizeRoute(route: Route): NormalizedRoute {
    const pattern = typeof route.pattern === 'string' ? new URLPattern({ pathname: route.pattern }) : route.pattern
    return {
        name: normalizeRouteName(route.name, route.method, pattern),
        pattern: pattern,
        handler: route.handler,
        method: route.method
    }
}

type RouteEntry<Ctx extends object> =
    | { kind: 'route', route: NormalizedRoute }
    | { kind: 'router', prefix?: string, router: Router<Ctx> }

type MatchResult<Ctx extends object> = {
    route: NormalizedRoute
    match: URLPatternResult
    middleware: Middleware<Ctx>[]
}

function joinPrefixPathname(prefix: string, pathname: string): string {
    if (!prefix) return pathname
    if (!prefix.startsWith('/')) prefix = '/' + prefix
    if (prefix.endsWith('/')) prefix = prefix.slice(0, -1)
    if (pathname === '/') return prefix || '/'
    if (!pathname.startsWith('/')) pathname = '/' + pathname
    return (prefix + pathname) || '/'
}

function stripPrefixPathname(prefix: string, pathname: string): string | null {
    if (!prefix) return pathname
    if (!prefix.startsWith('/')) prefix = '/' + prefix
    if (prefix.endsWith('/')) prefix = prefix.slice(0, -1)
    if (prefix === '/') return pathname

    if (pathname === prefix) return '/'
    if (pathname.startsWith(prefix + '/')) return pathname.slice(prefix.length)
    return null
}

export class Router<Ctx extends object = AnyContext> implements FetchHandler {
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

    add(route: Route) {
        this.entries.push({ kind: 'route', route: normalizeRoute(route) })
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
                return await Promise.try(handler as any, ctx)
            }

            const mw = middleware[i]
            return await Promise.try(mw as any, ctx, () => dispatch(i + 1))
        }

        return dispatch(0)
    }

    async fetch(
        request: Request,
        env: Record<string, unknown> = {},
        executionCtx?: ExecutionContext
    ): Promise<Response> {
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
