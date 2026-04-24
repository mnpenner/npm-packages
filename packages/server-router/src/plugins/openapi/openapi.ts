import {HttpMethod, HttpStatus, StatusText} from '@mpen/http-helpers'
import type {Router} from '../../router'
import type {Handler, JsonObjectSchema, JsonSchema, NormalizedRoute, RouteMeta, RouteSchema} from '../../types'

/**
 * OpenAPI document `info` section.
 */
export type OpenApiInfo = {
    title: string
    version: string
    description?: string
    termsOfService?: string
    contact?: Record<string, unknown>
    license?: Record<string, unknown>
}

/**
 * OpenAPI server definition.
 */
export type OpenApiServer = {
    url: string
    description?: string
    variables?: Record<string, unknown>
}

/**
 * OpenAPI operation object.
 */
export type OpenApiOperation = Record<string, unknown>

/**
 * OpenAPI paths dictionary keyed by pathname then method.
 */
export type OpenApiPaths = Record<string, Record<string, OpenApiOperation>>

/**
 * OpenAPI document returned by the `openapi` plugin handler.
 */
export type OpenApiDocument = {
    openapi: string
    info: OpenApiInfo
    servers?: OpenApiServer[]
    paths: OpenApiPaths
    components?: Record<string, unknown>
    security?: Array<Record<string, string[]>>
}

/**
 * Options used to build an OpenAPI document from registered routes.
 */
export type OpenApiOptions = {
    info: OpenApiInfo
    servers?: OpenApiServer[]
    components?: Record<string, unknown>
    security?: Array<Record<string, string[]>>
    openapi?: string
}

type OpenApiParameter = {
    name: string
    in: 'path' | 'query'
    required?: boolean
    schema: JsonSchema
}

type OpenApiRequestBody = {
    required?: boolean
    content: Record<string, {schema: JsonSchema}>
}

type OpenApiResponse = {
    description: string
    content?: Record<string, {schema: JsonSchema}>
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

function normalizeOpenApiMethods(route: NormalizedRoute<any>): string[] {
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

function buildParameterEntries(schema: JsonObjectSchema, location: 'path' | 'query'): OpenApiParameter[] {
    const properties = schema.properties
    const requiredList = Array.isArray(schema.required)
        ? schema.required.filter((value): value is string => typeof value === 'string')
        : []
    if (properties && typeof properties === 'object') {
        return Object.entries(properties).map(([name, propSchema]) => ({
            name,
            in: location,
            required: location === 'path' ? true : requiredList.includes(name),
            schema: (propSchema as JsonSchema) ?? {},
        }))
    }
    return [{
        name: location,
        in: location,
        required: location === 'path',
        schema,
    }]
}

function openApiRequestContentTypes(route: NormalizedRoute<any>): string[] {
    if (!route.accept || route.accept.length === 0) return ['application/json']
    const normalized = new Set<string>()
    for (const accept of route.accept) {
        normalized.add(accept.type)
    }
    return [...normalized]
}

function openApiResponseContentTypes(): string[] {
    return ['application/json']
}

function defaultResponseDescription(status: string): string {
    const numericStatus = Number(status)
    if (Number.isInteger(numericStatus)) {
        return StatusText[numericStatus as HttpStatus] ?? String(status)
    }
    return status
}

function buildOperationFromSchema(route: NormalizedRoute<any>): OpenApiOperation {
    const schema = route.schema
    const operation: OpenApiOperation = {}
    if (!schema) {
        operation.responses = {200: {description: 'OK'}}
        return operation
    }

    const parameters: OpenApiParameter[] = []
    if (schema.request?.query) {
        parameters.push(...buildParameterEntries(schema.request.query, 'query'))
    }
    if (schema.request?.path) {
        parameters.push(...buildParameterEntries(schema.request.path, 'path'))
    }
    if (parameters.length > 0) {
        operation.parameters = parameters
    }

    if (schema.request?.body !== undefined) {
        const content = Object.fromEntries(
            openApiRequestContentTypes(route).map(contentType => [contentType, {schema: schema.request!.body!}])
        )
        operation.requestBody = {
            required: true,
            content,
        } satisfies OpenApiRequestBody
    }

    if (schema.response?.body && Object.keys(schema.response.body).length > 0) {
        const contentTypes = openApiResponseContentTypes()
        operation.responses = Object.fromEntries(
            Object.entries(schema.response.body).map(([status, responseSchema]) => {
                const response: OpenApiResponse = {
                    description: defaultResponseDescription(status),
                }
                if (responseSchema !== undefined) {
                    response.content = Object.fromEntries(
                        contentTypes.map(contentType => [contentType, {schema: responseSchema}])
                    )
                }
                return [status, response]
            })
        )
    } else {
        operation.responses = {200: {description: 'OK'}}
    }

    return operation
}

function mergeOpenApiOperations(generated: OpenApiOperation, custom?: RouteMeta['openapi']): OpenApiOperation {
    if (!custom) return generated

    const merged: OpenApiOperation = {...generated, ...custom}
    const generatedParameters = Array.isArray(generated.parameters) ? generated.parameters : []
    const customParameters = Array.isArray(custom.parameters) ? custom.parameters : []
    if (generatedParameters.length > 0 || customParameters.length > 0) {
        merged.parameters = [...customParameters, ...generatedParameters]
    }

    if (generated.requestBody && custom.requestBody) {
        const generatedRequestBody = generated.requestBody as OpenApiRequestBody
        const customRequestBody = custom.requestBody as OpenApiRequestBody
        merged.requestBody = {
            ...generatedRequestBody,
            ...customRequestBody,
            content: {
                ...(generatedRequestBody.content ?? {}),
                ...(customRequestBody.content ?? {}),
            },
        }
    }

    if (generated.responses && custom.responses) {
        merged.responses = {
            ...(generated.responses as Record<string, unknown>),
            ...(custom.responses as Record<string, unknown>),
        }
    }

    return merged
}

function buildOperation(route: NormalizedRoute<any>): OpenApiOperation {
    return mergeOpenApiOperations(buildOperationFromSchema(route), route.meta?.openapi)
}

/**
 * Create an OpenAPI response handler that reflects the active router.
 *
 * @example
 * ```ts
 * router.add({
 *   path: '/swagger.json',
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
export function openapi(options: OpenApiOptions): Handler<OpenApiDocument> {
    return function openapiHandler(this: Router<any>): Response {
        const routes = this.getRoutes()
        const paths: OpenApiPaths = {}

        for (const route of routes) {
            const pathPattern = routePathToOpenApi(route.path.pathname)
            const methods = normalizeOpenApiMethods(route)
            if (methods.length === 0) continue

            const pathItem = paths[pathPattern] ?? (paths[pathPattern] = {})
            for (const method of methods) {
                pathItem[method] = buildOperation(route)
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
