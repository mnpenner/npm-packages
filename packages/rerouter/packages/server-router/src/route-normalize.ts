import type {MediaType, NormalizedRoute, Route} from './types'
import type {HttpMethod} from '@mpen/http-helpers'
import {normalizeMediaType, parseMediaType} from './lib/media-type'
import {pattToName, sanitizeNameParts, splitNameString} from './route-names'

function normalizeRouteName(
    name: Route['name'],
    method: HttpMethod | HttpMethod[] | undefined,
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
    let normalizedAccept: MediaType[] | undefined
    if (accept) {
        const acceptList = Array.isArray(accept) ? accept : [accept]
        normalizedAccept = acceptList.map(entry => {
            if (typeof entry === 'string') {
                const parsed = parseMediaType(entry)
                if (!parsed) {
                    throw new Error(`Invalid accept media type: ${entry}`)
                }
                return parsed
            }
            return normalizeMediaType(entry)
        })
        if (normalizedAccept.length === 0) {
            normalizedAccept = undefined
        }
    }
    return {
        name: normalizeRouteName(route.name, route.method, pattern),
        pattern,
        handler: route.handler,
        ...(route.meta === undefined ? {} : {meta: route.meta}),
        ...(method === undefined ? {} : {method}),
        ...(normalizedAccept === undefined ? {} : {accept: normalizedAccept}),
    }
}
