import {URLPattern} from 'urlpattern-polyfill'
import {Handler, RawError, rawErrorToResponse} from './create-zod-handler'
import {isResult} from 'neverject/result'

export interface Route {
    name?: string|string[]
    pattern: string|URLPattern
    handler: Handler<any, any, any, any>
    method: string
}

export interface NormalizedRoute {
    name: string[]
    pattern: URLPattern
    handler: Handler<any, any, any, any>
    method: string
}

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
    return sanitizeNameParts([combined])
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
