import type {AnyContext, MediaType, NormalizedRoute, Route} from './types'
import type {HttpMethod} from '@mpen/http-helpers'
import {normalizeMediaType, parseMediaType} from './lib/media-type'
import {pattToName, sanitizeNameParts, splitNameString} from './route-names'

function normalizeRouteName(
    name: Route['name'],
    method: HttpMethod | HttpMethod[] | undefined,
    path: URLPattern
): string[] {
    const methodName = Array.isArray(method) ? method[0] : method
    if (!name) {
        return pattToName(methodName ?? 'ANY', path)
    }
    if (typeof name === 'string') {
        return sanitizeNameParts(splitNameString(name))
    }
    return sanitizeNameParts(name)
}

export function normalizeRoute<Ctx extends object = AnyContext>(route: Route<Ctx>): NormalizedRoute<Ctx> {
    const routePath = route.path ?? route.pattern
    if (!routePath) {
        throw new Error('Route is missing a path')
    }
    const path = typeof routePath === 'string'
        ? new URLPattern({ pathname: routePath })
        : routePath
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
        name: normalizeRouteName(route.name, route.method, path),
        path,
        handler: route.handler,
        ...(route.match === undefined ? {} : {match: route.match}),
        ...(route.meta === undefined ? {} : {meta: route.meta}),
        ...(route.schema === undefined ? {} : {schema: route.schema}),
        ...(method === undefined ? {} : {method}),
        ...(normalizedAccept === undefined ? {} : {accept: normalizedAccept}),
    }
}
