import {URLPattern} from 'urlpattern-polyfill'
import {Handler, RawError, rawErrorToResponse} from './create-zod-handler'
import {isResult} from 'neverject/result'

export interface Route {
    name?: string
    pattern: string|URLPattern
    handler: Handler<any, any, any, any>
    method: string
}

export interface NormalizedRoute {
    name: string
    pattern: URLPattern
    handler: Handler<any, any, any, any>
    method: string
}

function upperFirst(str: string): string {
    return str.slice(0,1).toUpperCase() + str.slice(1)
}

export function pattToName(method: string, patt: URLPattern): string {
    const pathname = patt.pathname
    const parts = pathname.split('/').filter(p => p.length > 0)

    if (parts.length === 0) {
        return method.toLowerCase() + 'Index'
    }

    const cleaned = parts.map(part => {
        return part.replace(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '$$$1')
    }).map(part => part.replace(/[^a-zA-Z0-9_$]/g, ''))
    const capitalized = cleaned.map(upperFirst)
    return method.toLowerCase() + capitalized.join('')
}

export function normalizeRoute(route: Route): NormalizedRoute {
    const pattern = typeof route.pattern === 'string' ? new URLPattern({ pathname: route.pattern }) : route.pattern
    return {
        name: route.name ?? pattToName(route.method, pattern),
        pattern: pattern,
        handler: route.handler,
        method: route.method
    }
}

export class Router {
    private routes: NormalizedRoute[] = []

    add(route: Route) {
        this.routes.push(normalizeRoute(route))
    }

    getRoutes() {
        return [...this.routes]
    }

    async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url)
        const method = req.method.toUpperCase()

        for (const route of this.routes) {
            if (route.method.toUpperCase() !== method) continue
            const match = route.pattern.exec(url)
            if (!match) continue

            let body: unknown = undefined
            if (req.body) {
                try {
                    const contentType = req.headers.get('content-type') ?? ''
                    if (contentType.includes('application/json')) {
                        body = await req.json()
                    } else {
                        body = await req.text()
                    }
                } catch (e) {
                    return new Response(JSON.stringify({ error: String(e) }), { status: 400 })
                }
            }

            const pathParams = (match.pathname && (match as any).pathname.groups) || {}
            const queryParams = Object.fromEntries(url.searchParams.entries())

            const serverReq = {
                url: url.toString(),
                headers: req.headers,
                body,
                pathParams,
                queryParams,
                method,
            }

            const result = await route.handler(serverReq as any)
            if (isResult(result)) {
                return (result as any).ok ? (result as any).value as Response : rawErrorToResponse((result as any).error as RawError)
            }
            return result as Response
        }

        return new Response('Not Found', { status: 404 })
    }
}
