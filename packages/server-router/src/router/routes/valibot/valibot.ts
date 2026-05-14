import { HttpStatus } from '@mpen/http-helpers'
import { toJsonSchema } from '@valibot/to-json-schema'
import type { Router } from '../../router'
import type {
    AnyContext,
    Handler,
    HandlerContext,
    HandlerResult,
    JsonObjectSchema,
    JsonSchema,
    Route,
    RouteOptions,
    RouteSchema,
} from '../../types'
import * as v from 'valibot'

/**
 * Validation error component identifiers for Valibot-backed routes.
 */
export const enum ValibotValidationError {
    REQUEST_BODY,
    URL_PATH,
    QUERY_PARAMETERS,
}

type ValibotSchema = v.GenericSchema | undefined
type ValibotResponseBodySchemas = Record<number, v.GenericSchema> | undefined

/**
 * Default validation error payload returned by Valibot-backed routes.
 */
export type ValibotValidationErrorBody = {
    component: 'request_body' | 'url_path' | 'query_parameters'
    issues: v.BaseIssue<unknown>[]
    message: string
}

/**
 * Valibot schema input that mirrors the core route `schema` shape.
 */
export type ValibotRouteSchemaInput<
    BodySchema extends ValibotSchema = undefined,
    PathSchema extends ValibotSchema = undefined,
    QuerySchema extends ValibotSchema = undefined,
    ResponseBodySchemas extends ValibotResponseBodySchemas = undefined,
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

type InferSchema<Schema extends ValibotSchema> = Schema extends v.GenericSchema
    ? v.InferOutput<Schema>
    : unknown

type InferResponseBody<ResponseBodySchemas extends ValibotResponseBodySchemas> =
    ResponseBodySchemas extends Record<number, v.GenericSchema>
        ? 200 extends keyof ResponseBodySchemas
            ? v.InferOutput<ResponseBodySchemas[200]>
            : unknown
        : unknown

type NormalizeSchema<Schema> =
    Schema extends ValibotRouteSchemaInput<any, any, any, any>
        ? Schema
        : ValibotRouteSchemaInput<undefined, undefined, undefined, undefined>

type ExtractBodySchema<Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<infer BodySchema, any, any, any>
        ? BodySchema
        : undefined

type ExtractPathSchema<Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<any, infer PathSchema, any, any>
        ? PathSchema
        : undefined

type ExtractQuerySchema<Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<any, any, infer QuerySchema, any>
        ? QuerySchema
        : undefined

type ExtractResponseBodySchemas<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<
        any,
        any,
        any,
        infer ResponseBodySchemas
    >
        ? ResponseBodySchemas
        : undefined

/**
 * Validated request inputs exposed to a Valibot-backed handler.
 */
export type ValibotHandlerParams<
    BodySchema extends ValibotSchema,
    PathSchema extends ValibotSchema,
    QuerySchema extends ValibotSchema,
> = {
    path: InferSchema<PathSchema>
    query: InferSchema<QuerySchema>
    body: InferSchema<BodySchema>
}

/**
 * Context object exposed to a Valibot-backed handler.
 */
export type ValibotHandlerContext<
    BodySchema extends ValibotSchema,
    PathSchema extends ValibotSchema,
    QuerySchema extends ValibotSchema,
    Ctx extends object,
> = Omit<HandlerContext<Ctx>, 'pathParams'> & {
    params: ValibotHandlerParams<BodySchema, PathSchema, QuerySchema>
}

/**
 * Validation error handler used when request parsing fails.
 *
 * @param component - Request component that failed validation.
 * @param issues - The Valibot validation issues.
 * @returns A handler result that should be returned to the client.
 */
export type ValibotValidationErrorHandler = (
    component: ValibotValidationError,
    issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]],
) => HandlerResult

/**
 * Shared defaults that can be applied to Valibot route helpers.
 */
export type ValibotRouteHelperDefaults = {
    /**
     * Route schema fragments that should be merged into every built route.
     * Route-level schemas override matching request fields and response status codes.
     */
    schema?: ValibotRouteSchemaInput<any, any, any, any>
    /**
     * Whether to validate handler responses against `schema.response.body`.
     * Defaults to `process.env.NODE_ENV !== 'production'`.
     */
    validateResponse?: boolean
    /**
     * Override the default request validation error response.
     */
    validationError?: ValibotValidationErrorHandler
}

/**
 * Handler signature used by `valibotHandler`, `valibotPartial`, and `valibotRoute`.
 */
export type ValibotRouteHandler<
    BodySchema extends ValibotSchema,
    PathSchema extends ValibotSchema,
    QuerySchema extends ValibotSchema,
    ResponseBodySchemas extends ValibotResponseBodySchemas,
    Ctx extends object = AnyContext,
> = (
    this: Router<any>,
    ctx: ValibotHandlerContext<BodySchema, PathSchema, QuerySchema, Ctx>,
) => HandlerResult<InferResponseBody<ResponseBodySchemas>>

/**
 * Shared options used by `valibotHandler` and `valibotPartial`.
 */
export type ValibotHandlerOptions<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
> = ValibotRouteHelperDefaults & {
    schema?: Schema
    handler: ValibotRouteHandler<
        ExtractBodySchema<Schema>,
        ExtractPathSchema<Schema>,
        ExtractQuerySchema<Schema>,
        ExtractResponseBodySchemas<Schema>,
        Ctx
    >
}

/**
 * Route options used by `valibotRoute`.
 */
export type ValibotRouteOptions<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
> = Omit<Route<Ctx>, 'handler' | 'schema'> & ValibotHandlerOptions<Schema, Ctx>

/**
 * Method-specific route options used by `withValibot`.
 */
export type WithValibotOptions<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
> = Omit<RouteOptions<Ctx>, 'handler' | 'schema'> & ValibotHandlerOptions<Schema, Ctx>

/**
 * Valibot route builder created by `createValibotRoutes`.
 */
export type ValibotRoutes = <
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(
    options: WithValibotOptions<Schema, Ctx>,
) => RouteOptions<Ctx>

type ResolvedValibotHandlerOptions<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object,
> = {
    schema: Schema | undefined
    handler: ValibotRouteHandler<
        ExtractBodySchema<Schema>,
        ExtractPathSchema<Schema>,
        ExtractQuerySchema<Schema>,
        ExtractResponseBodySchemas<Schema>,
        Ctx
    >
    validateResponse: boolean
    validationError: ValibotValidationErrorHandler
}

type ResponseEnvelope = {
    status: number
    body: unknown
}

const validationErrorComponentName = new Map<
    ValibotValidationError,
    ValibotValidationErrorBody['component']
>([
    [ValibotValidationError.REQUEST_BODY, 'request_body'],
    [ValibotValidationError.URL_PATH, 'url_path'],
    [ValibotValidationError.QUERY_PARAMETERS, 'query_parameters'],
])

class ValibotResponseValidationError extends Error {
    readonly status: number
    readonly issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]

    constructor(status: number, issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]) {
        super(`Response validation failed for status ${status}: ${v.summarize(issues)}`)
        this.name = 'ValibotResponseValidationError'
        this.status = status
        this.issues = issues
    }
}

function createValidationResponse(
    component: ValibotValidationError,
    issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]],
): Response {
    const payload: ValibotValidationErrorBody = {
        component: validationErrorComponentName.get(component) ?? 'request_body',
        issues,
        message: v.summarize(issues),
    }
    return new Response(JSON.stringify(payload), {
        status: HttpStatus.BAD_REQUEST,
        headers: { 'content-type': 'application/json' },
    })
}

function resolveDefaults<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object,
>(
    options: ValibotHandlerOptions<Schema, Ctx>,
    defaults?: ValibotRouteHelperDefaults,
): ResolvedValibotHandlerOptions<Schema, Ctx> {
    return {
        schema: options.schema,
        handler: options.handler,
        validateResponse:
            options.validateResponse ??
            defaults?.validateResponse ??
            process.env.NODE_ENV !== 'production',
        validationError:
            options.validationError ?? defaults?.validationError ?? createValidationResponse,
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

function valibotIssuesFromThrowable(
    error: unknown,
): [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]] {
    return [
        {
            kind: 'schema',
            type: 'custom',
            input: undefined,
            expected: null,
            received: 'unknown',
            message: error instanceof Error ? error.message : String(error),
        },
    ]
}

function sanitizeJsonSchema(schema: JsonSchema): JsonSchema {
    if (Array.isArray(schema)) {
        return schema.map((entry) =>
            sanitizeJsonSchema(entry as JsonSchema),
        ) as unknown as JsonSchema
    }
    if (!schema || typeof schema !== 'object') {
        return schema
    }

    const sanitizedEntries = Object.entries(schema)
        .filter(([key]) => key !== '$schema' && key !== '~standard')
        .map(([key, value]) => [key, sanitizeJsonSchema(value as JsonSchema)])
    return Object.fromEntries(sanitizedEntries)
}

function toRequestJsonSchema(schema: v.GenericSchema): JsonSchema {
    return sanitizeJsonSchema(toJsonSchema(schema, { typeMode: 'input' }) as JsonSchema)
}

function toResponseJsonSchema(schema: v.GenericSchema): JsonSchema {
    return sanitizeJsonSchema(toJsonSchema(schema, { typeMode: 'output' }) as JsonSchema)
}

function buildRouteSchema(
    schema?: ValibotRouteSchemaInput<any, any, any, any>,
): RouteSchema | undefined {
    if (!schema) return undefined

    const request = schema.request
        ? {
              ...(schema.request.query
                  ? { query: toRequestJsonSchema(schema.request.query) as JsonObjectSchema }
                  : {}),
              ...(schema.request.path
                  ? { path: toRequestJsonSchema(schema.request.path) as JsonObjectSchema }
                  : {}),
              ...(schema.request.body ? { body: toRequestJsonSchema(schema.request.body) } : {}),
          }
        : undefined

    const responseBody = schema.response?.body
        ? Object.fromEntries(
              Object.entries(schema.response.body).map(([status, responseSchema]) => [
                  Number(status),
                  toResponseJsonSchema(responseSchema as v.GenericSchema),
              ]),
          )
        : undefined

    const response =
        responseBody && Object.keys(responseBody).length > 0 ? { body: responseBody } : undefined

    if ((!request || Object.keys(request).length === 0) && !response) {
        return undefined
    }

    return {
        ...(request && Object.keys(request).length > 0 ? { request } : {}),
        ...(response ? { response } : {}),
    }
}

function mergeRouteSchema(
    defaults: ValibotRouteHelperDefaults,
    schema: ValibotRouteSchemaInput<any, any, any, any> | undefined,
): ValibotRouteSchemaInput<any, any, any, any> | undefined {
    const defaultSchema = defaults.schema
    if (!defaultSchema) return schema
    if (!schema) return defaultSchema

    const request =
        !defaultSchema.request && !schema.request
            ? undefined
            : {
                  ...defaultSchema.request,
                  ...schema.request,
              }

    const responseBody =
        !defaultSchema.response?.body && !schema.response?.body
            ? undefined
            : {
                  ...(defaultSchema.response?.body ?? {}),
                  ...(schema.response?.body ?? {}),
              }

    const response = responseBody ? { body: responseBody } : undefined

    return {
        ...(request ? { request } : {}),
        ...(response ? { response } : {}),
    }
}

function mergeWithValibotOptions<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object,
>(
    defaults: ValibotRouteHelperDefaults,
    options: WithValibotOptions<Schema, Ctx>,
): WithValibotOptions<ValibotRouteSchemaInput<any, any, any, any>, Ctx> {
    const schema = mergeRouteSchema(defaults, options.schema)
    return {
        ...defaults,
        ...options,
        ...(schema === undefined ? {} : { schema }),
    }
}

function isResponseEnvelope(value: unknown): value is ResponseEnvelope {
    return (
        !!value &&
        typeof value === 'object' &&
        'status' in value &&
        typeof (value as { status: unknown }).status === 'number' &&
        'body' in value
    )
}

function isSkippableResponseValidationValue(value: unknown): boolean {
    return (
        value instanceof ReadableStream ||
        value instanceof Uint8Array ||
        (typeof Buffer !== 'undefined' && value instanceof Buffer) ||
        (!!value && typeof value === 'object' && Symbol.asyncIterator in value)
    )
}

function getResponseSchemaForStatus(
    schema: ValibotRouteSchemaInput<any, any, any, any> | undefined,
    status: number,
): v.GenericSchema | undefined {
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
    schema: ValibotRouteSchemaInput<any, any, any, any> | undefined,
    status: number,
    value: unknown,
): void {
    const responseSchema = getResponseSchemaForStatus(schema, status)
    if (!responseSchema) return
    const result = v.safeParse(responseSchema, value)
    if (!result.success) {
        throw new ValibotResponseValidationError(status, result.issues)
    }
}

async function validateHandlerResult(
    schema: ValibotRouteSchemaInput<any, any, any, any> | undefined,
    result: unknown,
): Promise<void> {
    if (result instanceof Response) {
        await Promise.resolve(
            assertResponseSchema(
                schema,
                result.status,
                await readResponseBodyForValidation(result),
            ),
        )
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
 * Build a route handler that parses request inputs with Valibot and optionally validates responses.
 *
 * @example
 * ```ts
 * const handler = valibotHandler({
 *   schema: {
 *     request: {
 *       path: v.object({id: v.string()}),
 *     },
 *     response: {
 *       body: {
 *         200: v.object({id: v.string()}),
 *       },
 *     },
 *   },
 *   handler: ({params}) => ({id: params.path.id}),
 * })
 * ```
 *
 * @param options - Handler definition extended with request and response Valibot schemas.
 * @returns A handler that validates request inputs before invoking the provided handler.
 */
export function valibotHandler<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(
    options: ValibotHandlerOptions<Schema, Ctx>,
): Handler<InferResponseBody<ExtractResponseBodySchemas<Schema>>, Ctx> {
    const resolved = resolveDefaults(options)

    return async function (this: Router<any>, ctx: HandlerContext<Ctx>) {
        const run = async (): Promise<
            HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
        > => {
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
            } as ValibotHandlerContext<
                ExtractBodySchema<Schema>,
                ExtractPathSchema<Schema>,
                ExtractQuerySchema<Schema>,
                Ctx
            >

            if (querySchema) {
                const queryResult = v.safeParse(querySchema, queryParams)
                if (!queryResult.success) {
                    return resolved.validationError(
                        ValibotValidationError.QUERY_PARAMETERS,
                        queryResult.issues,
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                handlerContext.params.query = queryResult.output as InferSchema<
                    ExtractQuerySchema<Schema>
                >
            }

            if (bodySchema) {
                let rawBody: unknown
                try {
                    rawBody = await readRequestBody(ctx.req)
                } catch (err) {
                    return resolved.validationError(
                        ValibotValidationError.REQUEST_BODY,
                        valibotIssuesFromThrowable(err),
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                const bodyResult = v.safeParse(bodySchema, rawBody)
                if (!bodyResult.success) {
                    return resolved.validationError(
                        ValibotValidationError.REQUEST_BODY,
                        bodyResult.issues,
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                handlerContext.params.body = bodyResult.output as InferSchema<
                    ExtractBodySchema<Schema>
                >
            }

            if (pathSchema) {
                const pathResult = v.safeParse(pathSchema, ctx.pathParams)
                if (!pathResult.success) {
                    return resolved.validationError(
                        ValibotValidationError.URL_PATH,
                        pathResult.issues,
                    ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                handlerContext.params.path = pathResult.output as InferSchema<
                    ExtractPathSchema<Schema>
                >
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
 * @param options - Valibot-backed handler definition with optional request and response schemas.
 * @returns The validated handler and generated route `schema`.
 */
export function valibotPartial<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(
    options: ValibotHandlerOptions<Schema, Ctx>,
): {
    handler: Handler<InferResponseBody<ExtractResponseBodySchemas<Schema>>, Ctx>
    schema?: RouteSchema
} {
    const schema = buildRouteSchema(options.schema)
    return {
        handler: valibotHandler(options),
        ...(schema ? { schema } : {}),
    }
}

/**
 * Build method-specific route options that validate inputs with Valibot and expose JSON Schema metadata.
 *
 * @example
 * ```ts
 * router.post('/users/:id', withValibot({
 *   name: 'user.update',
 *   schema: {
 *     request: {
 *       path: v.object({id: v.string()}),
 *       body: v.object({name: v.string()}),
 *     },
 *   },
 *   handler: ({params}) => ({id: params.path.id, name: params.body.name}),
 * }))
 * ```
 *
 * @param options - Method route options extended with Valibot request and response schemas.
 * @returns Route options compatible with method-specific router helpers.
 */
export function withValibot<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(options: WithValibotOptions<Schema, Ctx>): RouteOptions<Ctx> {
    const { schema, handler, validationError, validateResponse, ...routeOptions } = options
    const partial = valibotPartial<Schema, Ctx>({
        ...(schema ? { schema } : {}),
        handler,
        ...(validationError ? { validationError } : {}),
        ...(validateResponse === undefined ? {} : { validateResponse }),
    })
    return {
        ...routeOptions,
        handler: partial.handler,
        ...(partial.schema ? { schema: partial.schema } : {}),
    }
}

/**
 * Create a Valibot route builder with shared defaults.
 *
 * @example
 * ```ts
 * const valibot = createValibotRoutes({
 *   validateResponse: false,
 *   schema: {
 *     response: {
 *       body: {
 *         400: v.object({message: v.string()}),
 *       },
 *     },
 *   },
 * })
 *
 * router.post('/users/:id', valibot({
 *   name: 'user.update',
 *   schema: {
 *     request: {
 *       path: v.object({id: v.string()}),
 *     },
 *   },
 *   handler: ({params}) => ({id: params.path.id}),
 * }))
 * ```
 *
 * @param defaults - Default schema fragments, response validation, and request validation error handling.
 * @returns A route-options builder compatible with method-specific router helpers.
 */
export function createValibotRoutes(defaults: ValibotRouteHelperDefaults = {}): ValibotRoutes {
    return <
        Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object = AnyContext,
    >(
        options: WithValibotOptions<Schema, Ctx>,
    ): RouteOptions<Ctx> => withValibot(mergeWithValibotOptions(defaults, options))
}

/**
 * Build a full route definition that validates inputs with Valibot and exposes JSON Schema metadata.
 *
 * @param options - Route definition extended with Valibot request and response schemas.
 * @returns A route compatible with the core router.
 */
export function valibotRoute<
    Schema extends ValibotRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(options: ValibotRouteOptions<Schema, Ctx>): Route<Ctx> {
    const { schema, handler, validationError, validateResponse, ...route } = options
    const partial = valibotPartial<Schema, Ctx>({
        ...(schema ? { schema } : {}),
        handler,
        ...(validationError ? { validationError } : {}),
        ...(validateResponse === undefined ? {} : { validateResponse }),
    })
    return {
        ...route,
        handler: partial.handler,
        ...(partial.schema ? { schema: partial.schema } : {}),
    }
}
