import type {MediaType, NormalizedRoute, Route} from './types'
import {normalizeMediaType, parseMediaType} from './lib/media-type'
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
    const accept = route.accept
    let normalizedAccept: MediaType | undefined
    if (accept) {
        if (typeof accept === 'string') {
            const parsed = parseMediaType(accept)
            if (!parsed) {
                throw new Error(`Invalid accept media type: ${accept}`)
            }
            normalizedAccept = parsed
        } else {
            normalizedAccept = normalizeMediaType(accept)
        }
    }
    return {
        name: normalizeRouteName(route.name, route.method, pattern),
        pattern,
        handler: route.handler,
        ...(method === undefined ? {} : {method}),
        ...(normalizedAccept === undefined ? {} : {accept: normalizedAccept}),
    }
}
