import {URLPattern} from 'urlpattern-polyfill'
import type {NormalizedRoute, Route} from './types'
import {pattToName, sanitizeNameParts, splitNameString} from './route-names'

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
    const pattern = typeof route.pattern === 'string'
        ? new URLPattern({ pathname: route.pattern })
        : route.pattern
    return {
        name: normalizeRouteName(route.name, route.method, pattern),
        pattern,
        handler: route.handler,
        method: route.method,
    }
}

