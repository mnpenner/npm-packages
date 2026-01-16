import type {NormalizedRoute, Route} from './types'
import {pattToName, sanitizeNameParts, splitNameString} from './route-names'

function normalizeRouteName(
    name: Route['name'],
    method: string | string[] | undefined,
    pattern: URLPattern
): string[] {
    const methodName = Array.isArray(method) ? method[0] : method
    if (!name) {
        return pattToName(methodName ?? 'ANY', pattern)
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
    const method = route.method
    return {
        name: normalizeRouteName(route.name, route.method, pattern),
        pattern,
        handler: route.handler,
        ...(method === undefined ? {} : {method}),
    }
}
