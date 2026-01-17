import {HttpStatus} from '@mpen/http-helpers'
import type {Router} from '../router'
import type {Handler, HandlerContext, HandlerResult, Route} from '../types'
import {z} from 'zod'
import {JsonSchemaTarget} from '@mpen/server-router/lib/json-schema'

/**
 * Validation error component identifiers for Zod-backed routes.
 */
export const enum ValidationError {
    REQUEST_BODY,
    URL_PATH,
    QUERY_PARAMETERS,
}

type ErrorTree = ReturnType<typeof z.treeifyError>

type ValidationErrorBody = {
    component: 'request_body' | 'url_path' | 'query_parameters'
    errorTree: ErrorTree
    message: string
}

type ValidationErrorHandler = (component: ValidationError, error: z.ZodError) => HandlerResult

type InferSchema<Schema extends z.ZodTypeAny | undefined> =
    Schema extends z.ZodTypeAny ? z.infer<Schema> : unknown

export type ZodRouteHandler<TReqBody, TReqPath, TReqQuery, TOkRes, TErr = unknown> =
    (this: Router<any>, ctx: HandlerContext<TReqPath> & {body: TReqBody; path: TReqPath; query: TReqQuery}) => HandlerResult

export type ZodRouteDefinition<TReqBody, TReqPath, TReqQuery, TOkRes, TErr = unknown> =
    Omit<Route, 'handler'> & {handler: Handler<TReqBody, TReqPath, TReqQuery, TOkRes, TErr>}

export type ZodRouteOptions<
    BodySchema extends z.ZodTypeAny | undefined,
    PathSchema extends z.ZodTypeAny | undefined,
    QuerySchema extends z.ZodTypeAny | undefined,
    TOkRes,
    TErr = unknown,
> = Omit<Route, 'handler'> & {
    body?: BodySchema
    query?: QuerySchema
    path?: PathSchema
    handler: ZodRouteHandler<
        InferSchema<BodySchema>,
        InferSchema<PathSchema>,
        InferSchema<QuerySchema>,
        TOkRes,
        TErr
    >
    validationError?: ValidationErrorHandler
}

const validationErrorComponentName = new Map<ValidationError, ValidationErrorBody['component']>([
    [ValidationError.REQUEST_BODY, 'request_body'],
    [ValidationError.URL_PATH, 'url_path'],
    [ValidationError.QUERY_PARAMETERS, 'query_parameters'],
])

function createValidationResponse(component: ValidationError, error: z.ZodError): Response {
    const payload: ValidationErrorBody = {
        component: validationErrorComponentName.get(component) ?? 'request_body',
        errorTree: z.treeifyError(error),
        message: z.prettifyError(error),
    }
    return new Response(JSON.stringify(payload), {
        status: HttpStatus.BAD_REQUEST,
        headers: {'content-type': 'application/json'},
    })
}

function readQueryParams(searchParams: URLSearchParams): Record<string, string | string[]> {
    const query: Record<string, string | string[]> = {}
    for (const [key, value] of searchParams.entries()) {
        const existing = query[key]
        if (existing === undefined) {
            query[key] = value
            continue
        }
        if (Array.isArray(existing)) {
            existing.push(value)
        } else {
            query[key] = [existing, value]
        }
    }
    return query
}

async function readRequestBody(request: Request): Promise<unknown> {
    if (!request.body) return undefined
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
        return await request.json()
    }
    return await request.text()
}

function zodErrorFromThrowable(error: unknown): z.ZodError {
    return new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [],
        message: error instanceof Error ? error.message : String(error),
    }])
}

function toOpenApiSchema(schema: z.ZodTypeAny): Record<string, unknown> {
    return z.toJSONSchema(schema, {target: JsonSchemaTarget.OPENAPI_3_0}) as Record<string, unknown>
}

type OpenApiParameter = {
    name: string
    in: 'path' | 'query'
    required?: boolean
    schema: Record<string, unknown>
}

type OpenApiRequestBody = {
    required?: boolean
    content: Record<string, {schema: Record<string, unknown>}>
}

function buildParameterEntries(schema: z.ZodTypeAny, location: 'path' | 'query'): OpenApiParameter[] {
    const jsonSchema = toOpenApiSchema(schema)
    const properties = (jsonSchema as {properties?: Record<string, unknown>}).properties
    const requiredList = (jsonSchema as {required?: string[]}).required ?? []
    if (properties) {
        return Object.entries(properties).map(([name, propSchema]) => ({
            name,
            in: location,
            required: location === 'path' ? true : requiredList.includes(name),
            schema: propSchema as Record<string, unknown>,
        }))
    }
    return [{
        name: location,
        in: location,
        required: location === 'path',
        schema: jsonSchema,
    }]
}

function mergeOpenApiMeta(existing?: Record<string, unknown>, generated?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!existing && !generated) return undefined
    const merged = {...(existing ?? {})}
    if (generated) {
        for (const [key, value] of Object.entries(generated)) {
            if (key === 'parameters') {
                const existingParams = (existing?.parameters as unknown[] | undefined) ?? []
                const generatedParams = (value as unknown[] | undefined) ?? []
                merged.parameters = [...existingParams, ...generatedParams]
                continue
            }
            if (key === 'requestBody' && existing?.requestBody && value) {
                merged.requestBody = {...existing.requestBody, ...value}
                continue
            }
            merged[key] = value
        }
    }
    return merged
}

/**
 * Build a route that parses and validates request inputs using Zod.
 *
 * @example
 * ```ts
 * const route = zodRoute({
 *   pattern: '/users/:id',
 *   method: HttpMethod.GET,
 *   path: z.object({id: z.string()}),
 *   handler: ({path}) => new Response(`user=${path.id}`),
 * })
 * router.add(route)
 * ```
 *
 * @param options - Route definition extended with optional Zod schemas and error handling.
 * @returns A route with a handler that validates inputs before calling the provided handler.
 */
export function zodRoute<
    BodySchema extends z.ZodTypeAny | undefined,
    PathSchema extends z.ZodTypeAny | undefined,
    QuerySchema extends z.ZodTypeAny | undefined,
    TOkRes,
    TErr = unknown,
>(options: ZodRouteOptions<BodySchema, PathSchema, QuerySchema, TOkRes, TErr>): ZodRouteDefinition<
    InferSchema<BodySchema>,
    InferSchema<PathSchema>,
    InferSchema<QuerySchema>,
    TOkRes,
    TErr
> {
    const {
        body,
        query,
        path,
        handler,
        validationError,
        meta,
        ...route
    } = options
    const validationHandler = validationError ?? createValidationResponse
    const generatedOpenApi: Record<string, unknown> = {}
    if (body) {
        const schema = toOpenApiSchema(body)
        const requestBody: OpenApiRequestBody = {
            required: true,
            content: {
                'application/json': {schema},
            },
        }
        generatedOpenApi.requestBody = requestBody
    }
    if (query) {
        const parameters = buildParameterEntries(query, 'query')
        if (parameters.length > 0) generatedOpenApi.parameters = parameters
    }
    if (path) {
        const parameters = buildParameterEntries(path, 'path')
        generatedOpenApi.parameters = [
            ...(generatedOpenApi.parameters as OpenApiParameter[] | undefined ?? []),
            ...parameters,
        ]
    }

    const baseMeta = meta ? {...meta} : undefined
    const generatedMeta = Object.keys(generatedOpenApi).length > 0 ? generatedOpenApi : undefined
    const openapiMeta = mergeOpenApiMeta(meta?.[JsonSchemaTarget.OPENAPI_3_0] as Record<string, unknown> | undefined, generatedMeta)
    const routeMeta = openapiMeta
        ? {...(baseMeta ?? {}), [JsonSchemaTarget.OPENAPI_3_0]: openapiMeta}
        : baseMeta

    const wrappedHandler: Handler<
        InferSchema<BodySchema>,
        InferSchema<PathSchema>,
        InferSchema<QuerySchema>,
        TOkRes,
        TErr
    > = async function (this: Router<any>, ctx: HandlerContext<InferSchema<PathSchema>>) {
        const url = new URL(ctx.req.url)
        const queryParams = readQueryParams(url.searchParams)

        const handlerContext: {
            req: Request
            pathParams: InferSchema<PathSchema>
            body?: InferSchema<BodySchema>
            path?: InferSchema<PathSchema>
            query?: InferSchema<QuerySchema>
        } = {req: ctx.req, pathParams: ctx.pathParams}

        if (query) {
            const queryResult = query.safeParse(queryParams)
            if (!queryResult.success) {
                return validationHandler(ValidationError.QUERY_PARAMETERS, queryResult.error)
            }
            handlerContext.query = queryResult.data as InferSchema<QuerySchema>
        }

        if (body) {
            let rawBody: unknown
            try {
                rawBody = await readRequestBody(ctx.req)
            } catch (err) {
                return validationHandler(ValidationError.REQUEST_BODY, zodErrorFromThrowable(err))
            }
            const bodyResult = body.safeParse(rawBody)
            if (!bodyResult.success) {
                return validationHandler(ValidationError.REQUEST_BODY, bodyResult.error)
            }
            handlerContext.body = bodyResult.data as InferSchema<BodySchema>
        }

        if (path) {
            const pathResult = path.safeParse(ctx.pathParams)
            if (!pathResult.success) {
                return validationHandler(ValidationError.URL_PATH, pathResult.error)
            }
            handlerContext.path = pathResult.data as InferSchema<PathSchema>
        }

        return await handler.call(this, handlerContext as HandlerContext<InferSchema<PathSchema>> & {
            body: InferSchema<BodySchema>
            path: InferSchema<PathSchema>
            query: InferSchema<QuerySchema>
        })
    }

    return {
        ...route,
        ...(routeMeta ? {meta: routeMeta} : {}),
        handler: wrappedHandler,
    }
}
