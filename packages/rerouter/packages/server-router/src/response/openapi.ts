import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import type {Router} from '../router'
import type {Handler, NormalizedRoute} from '../types'

export type OpenApiInfo = {
    title: string
    version: string
    description?: string
    termsOfService?: string
    contact?: Record<string, unknown>
    license?: Record<string, unknown>
}

export type OpenApiServer = {
    url: string
    description?: string
    variables?: Record<string, unknown>
}

export type OpenApiOperation = Record<string, unknown>

export type OpenApiPaths = Record<string, Record<string, OpenApiOperation>>

export type OpenApiDocument = {
    openapi: string
    info: OpenApiInfo
    servers?: OpenApiServer[]
    paths: OpenApiPaths
    components?: Record<string, unknown>
    security?: Array<Record<string, string[]>>
}

export type OpenApiOptions = {
    info: OpenApiInfo
    servers?: OpenApiServer[]
    components?: Record<string, unknown>
    security?: Array<Record<string, string[]>>
    openapi?: string
}

const DEFAULT_OPENAPI_VERSION = '3.0.3'
const DEFAULT_METHODS: HttpMethod[] = [
    HttpMethod.GET,
    HttpMethod.PUT,
    HttpMethod.POST,
    HttpMethod.DELETE,
    HttpMethod.OPTIONS,
    HttpMethod.HEAD,
    HttpMethod.PATCH,
    HttpMethod.TRACE,
]

function routePathToOpenApi(pathname: string): string {
    return pathname.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

function normalizeOpenApiMethods(route: NormalizedRoute): string[] {
    const rawMethods = route.method
        ? (Array.isArray(route.method) ? route.method : [route.method])
        : DEFAULT_METHODS
    const normalized = new Set<string>()
    for (const method of rawMethods) {
        if (method === HttpMethod.CONNECT) continue
        normalized.add(method.toLowerCase())
    }
    return [...normalized]
}

function buildOperation(meta?: Record<string, unknown>): OpenApiOperation {
    const operation: OpenApiOperation = {...(meta ?? {})}
    if (!('responses' in operation)) {
        operation.responses = {200: {description: 'OK'}}
    }
    return operation
}

/**
 * Create an OpenAPI response handler that reflects the active router.
 *
 * @example
 * ```ts
 * router.add({
 *   pattern: '/swagger.json',
 *   method: HttpMethod.GET,
 *   handler: openapi({
 *     info: {title: 'Example API', version: '1.0.0'},
 *     servers: [{url: 'https://api.example.com'}],
 *   }),
 * })
 * ```
 *
 * @param options - OpenAPI document options for info, servers, and optional components/security.
 * @returns A route handler that returns the generated OpenAPI JSON document.
 */
export function openapi(options: OpenApiOptions): Handler<unknown, unknown, unknown, OpenApiDocument> {
    return function openapiHandler(this: Router<any>): Response {
        const routes = this.getRoutes()
        const paths: OpenApiPaths = {}

        for (const route of routes) {
            const pathPattern = routePathToOpenApi(route.pattern.pathname)
            const methods = normalizeOpenApiMethods(route)
            if (methods.length === 0) continue

            const pathItem = paths[pathPattern] ?? (paths[pathPattern] = {})
            for (const method of methods) {
                pathItem[method] = buildOperation(route.meta?.openapi as Record<string, unknown> | undefined)
            }
        }

        const document: OpenApiDocument = {
            openapi: options.openapi ?? DEFAULT_OPENAPI_VERSION,
            info: options.info,
            paths,
            ...(options.servers ? {servers: options.servers} : {}),
            ...(options.components ? {components: options.components} : {}),
            ...(options.security ? {security: options.security} : {}),
        }

        return new Response(JSON.stringify(document), {
            status: HttpStatus.OK,
            headers: {'content-type': 'application/json'},
        })
    }
}
