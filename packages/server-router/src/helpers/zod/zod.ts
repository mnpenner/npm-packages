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
 * Default validation error payload returned by Zod-backed routes.
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

/**
 * Validated request inputs exposed to a Zod-backed handler.
 */
export type ZodHandlerParams<
    BodySchema extends ZodSchema,
    PathSchema extends ZodSchema,
    QuerySchema extends ZodSchema,
> = {
    path: InferSchema<PathSchema>
    query: InferSchema<QuerySchema>
    body: InferSchema<BodySchema>
}

/**
 * Context object exposed to a Zod-backed handler.
 */
export type ZodHandlerContext<
    BodySchema extends ZodSchema,
    PathSchema extends ZodSchema,
    QuerySchema extends ZodSchema,
    Ctx extends object,
> = Omit<HandlerContext<Ctx>, 'pathParams'> & {
    params: ZodHandlerParams<BodySchema, PathSchema, QuerySchema>
}

/**
 * Validation error handler used when request parsing fails.
 *
 * @param component - Request component that failed validation.
 * @param error - The Zod validation error.
 * @returns A handler result that should be returned to the client.
 */
export type ValidationErrorHandler = (component: ValidationError, error: z.ZodError) => HandlerResult

/**
 * Shared defaults that can be applied to Zod route helpers.
 */
export type ZodRouteHelperDefaults = {
    /**
     * Route schema fragments that should be merged into every factory-built route.
     * Route-level schemas override matching request fields and response status codes.
     */
    schema?: ZodRouteSchemaInput<any, any, any, any>
    /**
     * Whether to validate handler responses against `schema.response.body`.
     * Defaults to `process.env.NODE_ENV !== 'production'`.
     */
    validateResponse?: boolean
    /**
     * Override the default request validation error response.
     */
    validationError?: ValidationErrorHandler
}

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
> = ZodRouteHelperDefaults & {
    schema?: Schema
    handler: ZodRouteHandler<
        ExtractBodySchema<Schema>,
        ExtractPathSchema<Schema>,
        ExtractQuerySchema<Schema>,
        ExtractResponseBodySchemas<Schema>,
        Ctx
    >
}

/**
 * Route options used by `zodRoute`.
 */
export type ZodRouteOptions<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
> = Omit<Route<Ctx>, 'handler' | 'schema'> & ZodHandlerOptions<Schema, Ctx>

type ResolvedZodHandlerOptions<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object,
> = {
    schema: Schema | undefined
    handler: ZodRouteHandler<
        ExtractBodySchema<Schema>,
        ExtractPathSchema<Schema>,
        ExtractQuerySchema<Schema>,
        ExtractResponseBodySchemas<Schema>,
        Ctx
    >
    validateResponse: boolean
    validationError: ValidationErrorHandler
}

type ResponseEnvelope = {
    status: number
    body: unknown
}

const validationErrorComponentName = new Map<ValidationError, ZodValidationErrorBody['component']>([
    [ValidationError.REQUEST_BODY, 'request_body'],
    [ValidationError.URL_PATH, 'url_path'],
    [ValidationError.QUERY_PARAMETERS, 'query_parameters'],
])

class ZodResponseValidationError extends Error {
    readonly status: number
    readonly error: z.ZodError

    constructor(status: number, error: z.ZodError) {
        super(`Response validation failed for status ${status}: ${z.prettifyError(error)}`)
        this.name = 'ZodResponseValidationError'
        this.status = status
        this.error = error
    }
}

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

function resolveDefaults<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object,
>(
    options: ZodHandlerOptions<Schema, Ctx>,
    defaults?: ZodRouteHelperDefaults
): ResolvedZodHandlerOptions<Schema, Ctx> {
    return {
        schema: options.schema,
        handler: options.handler,
        validateResponse: options.validateResponse ?? defaults?.validateResponse ?? process.env.NODE_ENV !== 'production',
        validationError: options.validationError ?? defaults?.validationError ?? createValidationResponse,
    }
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

function isResponseEnvelope(value: unknown): value is ResponseEnvelope {
    return !!value
        && typeof value === 'object'
        && 'status' in value
        && typeof (value as {status: unknown}).status === 'number'
        && 'body' in value
}

function isSkippableResponseValidationValue(value: unknown): boolean {
    return value instanceof ReadableStream
        || value instanceof Uint8Array
        || (typeof Buffer !== 'undefined' && value instanceof Buffer)
        || (!!value && typeof value === 'object' && Symbol.asyncIterator in value)
}

function getResponseSchemaForStatus(
    schema: ZodRouteSchemaInput<any, any, any, any> | undefined,
    status: number
): z.ZodTypeAny | undefined {
    return schema?.response?.body?.[status]
}

async function readResponseBodyForValidation(response: Response): Promise<unknown> {
    if (!response.body) return undefined
    const contentType = response.headers.get('content-type') ?? ''
    const clone = response.clone()
    if (contentType.includes('application/json') || /\+json\b/i.test(contentType)) {
        return await clone.json()
    }
    return await clone.text()
}

function assertResponseSchema(
    schema: ZodRouteSchemaInput<any, any, any, any> | undefined,
    status: number,
    value: unknown
): void {
    const responseSchema = getResponseSchemaForStatus(schema, status)
    if (!responseSchema) return
    const result = responseSchema.safeParse(value)
    if (!result.success) {
        throw new ZodResponseValidationError(status, result.error)
    }
}

async function validateHandlerResult(
    schema: ZodRouteSchemaInput<any, any, any, any> | undefined,
    result: unknown
): Promise<void> {
    if (result instanceof Response) {
        await Promise.resolve(assertResponseSchema(schema, result.status, await readResponseBodyForValidation(result)))
        return
    }
    if (isResponseEnvelope(result)) {
        assertResponseSchema(schema, result.status, result.body)
        return
    }
    if (isSkippableResponseValidationValue(result)) {
        return
    }
    assertResponseSchema(schema, HttpStatus.OK, result)
}

/**
 * Build a route handler that parses request inputs with Zod and optionally validates responses.
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
 *   handler: ({params}) => ({id: params.path.id}),
 * })
 * ```
 *
 * @param options - Handler definition extended with request and response Zod schemas.
 * @returns A handler that validates request inputs before invoking the provided handler.
 */
export function zodHandler<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(options: ZodHandlerOptions<Schema, Ctx>): Handler<InferResponseBody<ExtractResponseBodySchemas<Schema>>, Ctx> {
    const resolved = resolveDefaults(options)

    return async function (this: Router<any>, ctx: HandlerContext<Ctx>) {
        const run = async (): Promise<HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>> => {
            const bodySchema = resolved.schema?.request?.body
            const pathSchema = resolved.schema?.request?.path
            const querySchema = resolved.schema?.request?.query
            const queryParams = readQueryParams(ctx.url.searchParams)

            const handlerContext = {
                ...ctx,
                params: {
                    path: ctx.pathParams as InferSchema<ExtractPathSchema<Schema>>,
                    query: undefined as InferSchema<ExtractQuerySchema<Schema>>,
                    body: undefined as InferSchema<ExtractBodySchema<Schema>>,
                },
            } as ZodHandlerContext<
                ExtractBodySchema<Schema>,
                ExtractPathSchema<Schema>,
                ExtractQuerySchema<Schema>,
                Ctx
            >

            if (querySchema) {
                const queryResult = querySchema.safeParse(queryParams)
                if (!queryResult.success) {
                    return resolved.validationError(
                        ValidationError.QUERY_PARAMETERS,
                        queryResult.error
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                handlerContext.params.query = queryResult.data as InferSchema<ExtractQuerySchema<Schema>>
            }

            if (bodySchema) {
                let rawBody: unknown
                try {
                    rawBody = await readRequestBody(ctx.req)
                } catch (err) {
                    return resolved.validationError(
                        ValidationError.REQUEST_BODY,
                        zodErrorFromThrowable(err)
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                const bodyResult = bodySchema.safeParse(rawBody)
                if (!bodyResult.success) {
                    return resolved.validationError(
                        ValidationError.REQUEST_BODY,
                        bodyResult.error
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                handlerContext.params.body = bodyResult.data as InferSchema<ExtractBodySchema<Schema>>
            }

            if (pathSchema) {
                const pathResult = pathSchema.safeParse(ctx.pathParams)
                if (!pathResult.success) {
                    return resolved.validationError(
                        ValidationError.URL_PATH,
                        pathResult.error
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                handlerContext.params.path = pathResult.data as InferSchema<ExtractPathSchema<Schema>>
            }

            const result = await resolved.handler.call(this, handlerContext)
            if (resolved.validateResponse) {
                await validateHandlerResult(resolved.schema, result)
            }
            return result
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
    handler: Handler<InferResponseBody<ExtractResponseBodySchemas<Schema>>, Ctx>
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
    const {schema, handler, validationError, validateResponse, ...route} = options
    const partial = zodPartial<Schema, Ctx>({
        ...(schema ? {schema} : {}),
        handler,
        ...(validationError ? {validationError} : {}),
        ...(validateResponse === undefined ? {} : {validateResponse}),
    })
    return {
        ...route,
        handler: partial.handler,
        ...(partial.schema ? {schema: partial.schema} : {}),
    }
}
