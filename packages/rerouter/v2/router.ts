import {URLPattern} from 'urlpattern-polyfill'
import {Handler} from './create-zod-handler'

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
}
