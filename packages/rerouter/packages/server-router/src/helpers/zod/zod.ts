import {HttpStatus} from '@mpen/http-helpers'
import type {Router} from '../../router'
import type {
    AnyContext,
    Handler,
    HandlerContext,
    HandlerResult,
    JsonObjectSchema,
    JsonSchema,
    Route,
    RouteSchema
} from '../../types'
import {z} from 'zod'

/**
 * Validation error component identifiers for Zod-backed routes.
 */
export const enum ValidationError {
    REQUEST_BODY,
    URL_PATH,
    QUERY_PARAMETERS,
}

type ErrorTree = ReturnType<typeof z.treeifyError>
type ZodSchema = z.ZodTypeAny | undefined
type ZodResponseBodySchemas = Record<number, z.ZodTypeAny> | undefined

/**
 * Default validation error payload returned by `zodHandler` and `zodRoute`.
 */
export type ZodValidationErrorBody = {
    component: 'request_body' | 'url_path' | 'query_parameters'
    errorTree: ErrorTree
    message: string
}

/**
 * Zod schema input that mirrors the core route `schema` shape.
 */
export type ZodRouteSchemaInput<
    BodySchema extends ZodSchema = undefined,
    PathSchema extends ZodSchema = undefined,
    QuerySchema extends ZodSchema = undefined,
    ResponseBodySchemas extends ZodResponseBodySchemas = undefined,
> = {
    request?: {
        query?: QuerySchema
        path?: PathSchema
        body?: BodySchema
    }
    response?: {
        body?: ResponseBodySchemas
    }
}

type InferSchema<Schema extends ZodSchema> =
    Schema extends z.ZodTypeAny ? z.infer<Schema> : unknown

type InferResponseBody<ResponseBodySchemas extends ZodResponseBodySchemas> =
    ResponseBodySchemas extends Record<number, z.ZodTypeAny>
        ? 200 extends keyof ResponseBodySchemas
            ? z.infer<ResponseBodySchemas[200]>
            : unknown
        : unknown

type NormalizeSchema<Schema> =
    Schema extends ZodRouteSchemaInput<any, any, any, any>
        ? Schema
        : ZodRouteSchemaInput<undefined, undefined, undefined, undefined>

type ExtractBodySchema<Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<infer BodySchema, any, any, any> ? BodySchema : undefined

type ExtractPathSchema<Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<any, infer PathSchema, any, any> ? PathSchema : undefined

type ExtractQuerySchema<Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<any, any, infer QuerySchema, any> ? QuerySchema : undefined

type ExtractResponseBodySchemas<Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<any, any, any, infer ResponseBodySchemas> ? ResponseBodySchemas : undefined

type ZodHandlerContext<
    BodySchema extends ZodSchema,
    PathSchema extends ZodSchema,
    QuerySchema extends ZodSchema,
    Ctx extends object,
> = HandlerContext<InferSchema<PathSchema>, Ctx> & {
    body: InferSchema<BodySchema>
    query: InferSchema<QuerySchema>
}

/**
 * Validation error handler used when request parsing fails.
 */
export type ValidationErrorHandler = (component: ValidationError, error: z.ZodError) => HandlerResult

/**
 * Handler signature used by `zodHandler`, `zodPartial`, and `zodRoute`.
 */
export type ZodRouteHandler<
    BodySchema extends ZodSchema,
    PathSchema extends ZodSchema,
    QuerySchema extends ZodSchema,
    ResponseBodySchemas extends ZodResponseBodySchemas,
    Ctx extends object = AnyContext,
> = (
    this: Router<any>,
    ctx: ZodHandlerContext<BodySchema, PathSchema, QuerySchema, Ctx>
) => HandlerResult<InferResponseBody<ResponseBodySchemas>>

/**
 * Shared options used by `zodHandler` and `zodPartial`.
 */
export type ZodHandlerOptions<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
> = {
    schema?: Schema
    handler: ZodRouteHandler<
        ExtractBodySchema<Schema>,
        ExtractPathSchema<Schema>,
        ExtractQuerySchema<Schema>,
        ExtractResponseBodySchemas<Schema>,
        Ctx
    >
    validationError?: ValidationErrorHandler
}

/**
 * Route options used by `zodRoute`.
 */
export type ZodRouteOptions<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
> = Omit<Route<Ctx>, 'handler' | 'schema'> & ZodHandlerOptions<Schema, Ctx>

const validationErrorComponentName = new Map<ValidationError, ZodValidationErrorBody['component']>([
    [ValidationError.REQUEST_BODY, 'request_body'],
    [ValidationError.URL_PATH, 'url_path'],
    [ValidationError.QUERY_PARAMETERS, 'query_parameters'],
])

function createValidationResponse(component: ValidationError, error: z.ZodError): Response {
    const payload: ZodValidationErrorBody = {
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

function sanitizeJsonSchema(schema: JsonSchema): JsonSchema {
    if (Array.isArray(schema)) {
        return schema.map(entry => sanitizeJsonSchema(entry as JsonSchema)) as unknown as JsonSchema
    }
    if (!schema || typeof schema !== 'object') {
        return schema
    }

    const sanitizedEntries = Object.entries(schema)
        .filter(([key]) => key !== '$schema' && key !== '~standard')
        .map(([key, value]) => [key, sanitizeJsonSchema(value as JsonSchema)])
    return Object.fromEntries(sanitizedEntries)
}

function toJsonSchema(schema: z.ZodTypeAny): JsonSchema {
    return sanitizeJsonSchema(z.toJSONSchema(schema) as JsonSchema)
}

function buildRouteSchema(schema?: ZodRouteSchemaInput<any, any, any, any>): RouteSchema | undefined {
    if (!schema) return undefined

    const request = schema.request
        ? {
            ...(schema.request.query ? {query: toJsonSchema(schema.request.query) as JsonObjectSchema} : {}),
            ...(schema.request.path ? {path: toJsonSchema(schema.request.path) as JsonObjectSchema} : {}),
            ...(schema.request.body ? {body: toJsonSchema(schema.request.body)} : {}),
        }
        : undefined

    const responseBody = schema.response?.body
        ? Object.fromEntries(
            Object.entries(schema.response.body).map(([status, responseSchema]) => [
                Number(status),
                toJsonSchema(responseSchema as z.ZodTypeAny),
            ])
        )
        : undefined

    const response = responseBody && Object.keys(responseBody).length > 0
        ? {body: responseBody}
        : undefined

    if ((!request || Object.keys(request).length === 0) && !response) {
        return undefined
    }

    return {
        ...(request && Object.keys(request).length > 0 ? {request} : {}),
        ...(response ? {response} : {}),
    }
}

/**
 * Build a route handler that parses and validates request inputs using Zod.
 *
 * @example
 * ```ts
 * const handler = zodHandler({
 *   schema: {
 *     request: {
 *       path: z.object({id: z.string()}),
 *     },
 *     response: {
 *       body: {
 *         200: z.object({id: z.string()}),
 *       },
 *     },
 *   },
 *   handler: ({pathParams}) => ({id: pathParams.id}),
 * })
 * ```
 *
 * @param options - Handler definition extended with optional Zod request schemas and validation error handling.
 * @returns A handler that validates request inputs before calling the provided handler.
 */
export function zodHandler<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(options: ZodHandlerOptions<Schema, Ctx>): Handler<
    InferSchema<ExtractBodySchema<Schema>>,
    InferSchema<ExtractPathSchema<Schema>>,
    InferSchema<ExtractQuerySchema<Schema>>,
    InferResponseBody<ExtractResponseBodySchemas<Schema>>,
    unknown,
    Ctx
> {
    const validationHandler = options.validationError ?? createValidationResponse

    return async function (this: Router<any>, ctx: HandlerContext<InferSchema<ExtractPathSchema<Schema>>, Ctx>) {
        const run = async (): Promise<HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>> => {
        const bodySchema = options.schema?.request?.body
        const pathSchema = options.schema?.request?.path
        const querySchema = options.schema?.request?.query
        const queryParams = readQueryParams(ctx.url.searchParams)

        const handlerContext = {
            ...ctx,
            body: undefined as InferSchema<ExtractBodySchema<Schema>>,
            query: undefined as InferSchema<ExtractQuerySchema<Schema>>,
        } as ZodHandlerContext<
            ExtractBodySchema<Schema>,
            ExtractPathSchema<Schema>,
            ExtractQuerySchema<Schema>,
            Ctx
        >

        if (querySchema) {
            const queryResult = querySchema.safeParse(queryParams)
            if (!queryResult.success) {
                return validationHandler(
                    ValidationError.QUERY_PARAMETERS,
                    queryResult.error
                ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
            }
            handlerContext.query = queryResult.data as InferSchema<ExtractQuerySchema<Schema>>
        }

        if (bodySchema) {
            let rawBody: unknown
            try {
                rawBody = await readRequestBody(ctx.req)
            } catch (err) {
                return validationHandler(
                    ValidationError.REQUEST_BODY,
                    zodErrorFromThrowable(err)
                ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
            }
            const bodyResult = bodySchema.safeParse(rawBody)
            if (!bodyResult.success) {
                return validationHandler(
                    ValidationError.REQUEST_BODY,
                    bodyResult.error
                ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
            }
            handlerContext.body = bodyResult.data as InferSchema<ExtractBodySchema<Schema>>
        }

        if (pathSchema) {
            const pathResult = pathSchema.safeParse(ctx.pathParams)
            if (!pathResult.success) {
                return validationHandler(
                    ValidationError.URL_PATH,
                    pathResult.error
                ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
            }
            handlerContext.pathParams = pathResult.data as InferSchema<ExtractPathSchema<Schema>>
        }

        return await options.handler.call(this, handlerContext)
        }

        return await run()
    }
}

/**
 * Build a validated handler plus the matching JSON Schema route metadata.
 *
 * @param options - Zod-backed handler definition with optional request and response schemas.
 * @returns The validated handler and generated route `schema`.
 */
export function zodPartial<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(options: ZodHandlerOptions<Schema, Ctx>): {
    handler: Handler<
        InferSchema<ExtractBodySchema<Schema>>,
        InferSchema<ExtractPathSchema<Schema>>,
        InferSchema<ExtractQuerySchema<Schema>>,
        InferResponseBody<ExtractResponseBodySchemas<Schema>>,
        unknown,
        Ctx
    >
    schema?: RouteSchema
} {
    const schema = buildRouteSchema(options.schema)
    return {
        handler: zodHandler(options),
        ...(schema ? {schema} : {}),
    }
}

/**
 * Build a full route definition that validates inputs with Zod and exposes JSON Schema metadata.
 *
 * @param options - Route definition extended with Zod request and response schemas.
 * @returns A route compatible with the core router.
 */
export function zodRoute<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(options: ZodRouteOptions<Schema, Ctx>): Route<Ctx> {
    const {schema, handler, validationError, ...route} = options
    const partial = zodPartial<Schema, Ctx>({
        ...(schema ? {schema} : {}),
        handler,
        ...(validationError ? {validationError} : {}),
    })
    return {
        ...route,
        handler: partial.handler,
        ...(partial.schema ? {schema: partial.schema} : {}),
    }
}
