import { HttpStatus } from '@mpen/http'
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
import { isRoutekitBody, isRoutekitResponse, response } from '../../response'
import { z } from 'zod'

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
type AnyZodResponseBodySchemas = Partial<Record<number | 'default', z.ZodTypeAny>>
type ZodResponseBodySchemas = AnyZodResponseBodySchemas | undefined
type ResponseValidationMode = false | 'strict' | 'parse'
type ResponseValidationOption = boolean | ResponseValidationMode
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

type InferSchema<Schema extends ZodSchema> = Schema extends z.ZodTypeAny ? z.infer<Schema> : unknown

type InferResponseBodySchemaUnion<ResponseBodySchemas extends AnyZodResponseBodySchemas> = [
    keyof ResponseBodySchemas,
] extends [never]
    ? unknown
    : {
          [Status in keyof ResponseBodySchemas]: NonNullable<
              ResponseBodySchemas[Status]
          > extends z.ZodTypeAny
              ? z.infer<NonNullable<ResponseBodySchemas[Status]>>
              : never
      }[keyof ResponseBodySchemas]

type InferResponseBody<ResponseBodySchemas extends ZodResponseBodySchemas> =
    ResponseBodySchemas extends AnyZodResponseBodySchemas
        ? 200 extends keyof ResponseBodySchemas
            ? InferResponseBodySchemaUnion<ResponseBodySchemas>
            : 'default' extends keyof ResponseBodySchemas
              ? InferResponseBodySchemaUnion<ResponseBodySchemas>
              : unknown
        : unknown

type NormalizeSchema<Schema> =
    Schema extends ZodRouteSchemaInput<any, any, any, any>
        ? Schema
        : ZodRouteSchemaInput<undefined, undefined, undefined, undefined>

type ExtractBodySchema<Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<infer BodySchema, any, any, any>
        ? BodySchema
        : undefined

type ExtractPathSchema<Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<any, infer PathSchema, any, any>
        ? PathSchema
        : undefined

type ExtractQuerySchema<Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<any, any, infer QuerySchema, any>
        ? QuerySchema
        : undefined

type ExtractResponseBodySchemas<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
> =
    NormalizeSchema<Schema> extends ZodRouteSchemaInput<any, any, any, infer ResponseBodySchemas>
        ? ResponseBodySchemas
        : undefined

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
export type ValidationErrorHandler = (
    component: ValidationError,
    error: z.ZodError,
) => HandlerResult

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
     * Whether and how to apply `schema.response.body` to handler responses.
     * `false` disables response validation, `true` and `'strict'` validate without changing the
     * response body, and `'parse'` returns the parsed response body. Defaults to `'parse'`.
     */
    validateResponse?: ResponseValidationOption
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
    ctx: ZodHandlerContext<BodySchema, PathSchema, QuerySchema, Ctx>,
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

/**
 * Method-specific route options used by `withZod`.
 */
export type WithZodOptions<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
> = Omit<RouteOptions<Ctx>, 'handler' | 'schema'> & ZodHandlerOptions<Schema, Ctx>

/**
 * Zod route builder created by `createZodRoutes`.
 *
 * @example
 * ```ts
 * const route = createZodRoutes()
 *
 * router.get('/users/:id', route({
 *   schema: {
 *     request: {
 *       path: z.object({id: z.string()}),
 *     },
 *   },
 *   handler: ({params}) => ({id: params.path.id}),
 * }))
 *
 * router.add(route({
 *   method: HttpMethod.GET,
 *   path: '/health',
 *   handler: () => ({ok: true}),
 * }))
 * ```
 */
export type ZodRoutes = {
    /**
     * Build a full route definition that includes its own path.
     *
     * @param options - Full route options including `path`.
     * @returns A full route definition compatible with [`Router.add`]{@link Router#add}.
     */
    <
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object = AnyContext,
    >(
        options: ZodRouteOptions<Schema, Ctx>,
    ): Route<Ctx>
    /**
     * Build method-specific route options that leave the path to the registering router.
     *
     * @param options - Method route options without a route path.
     * @returns Route options compatible with helpers like [`Router.get`]{@link Router#get}.
     */
    <
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object = AnyContext,
    >(
        options: WithZodOptions<Schema, Ctx>,
    ): RouteOptions<Ctx>
}

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
    validateResponse: ResponseValidationMode
    validationError: ValidationErrorHandler
}

type ResponseBodyForValidation = {
    value: unknown
    writableJson: boolean
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

function createValidationResponse(component: ValidationError, error: z.ZodError): HandlerResult {
    const payload: ZodValidationErrorBody = {
        component: validationErrorComponentName.get(component) ?? 'request_body',
        errorTree: z.treeifyError(error),
        message: z.prettifyError(error),
    }
    return response(payload, { status: HttpStatus.BAD_REQUEST })
}

function normalizeResponseValidationMode(
    option: ResponseValidationOption | undefined,
): ResponseValidationMode | undefined {
    if (option === true) return 'strict'
    return option
}

function resolveDefaults<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object,
>(
    options: ZodHandlerOptions<Schema, Ctx>,
    defaults?: ZodRouteHelperDefaults,
): ResolvedZodHandlerOptions<Schema, Ctx> {
    return {
        schema: options.schema,
        handler: options.handler,
        validateResponse:
            normalizeResponseValidationMode(options.validateResponse) ??
            normalizeResponseValidationMode(defaults?.validateResponse) ??
            'parse',
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

function zodErrorFromThrowable(error: unknown): z.ZodError {
    return new z.ZodError([
        {
            code: z.ZodIssueCode.custom,
            path: [],
            message: error instanceof Error ? error.message : String(error),
        },
    ])
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

function toJsonSchema(schema: z.ZodTypeAny): JsonSchema {
    return sanitizeJsonSchema(z.toJSONSchema(schema) as JsonSchema)
}

function buildRouteSchema(
    schema?: ZodRouteSchemaInput<any, any, any, any>,
): RouteSchema | undefined {
    if (!schema) return undefined

    const request = schema.request
        ? {
              ...(schema.request.query
                  ? { query: toJsonSchema(schema.request.query) as JsonObjectSchema }
                  : {}),
              ...(schema.request.path
                  ? { path: toJsonSchema(schema.request.path) as JsonObjectSchema }
                  : {}),
              ...(schema.request.body ? { body: toJsonSchema(schema.request.body) } : {}),
          }
        : undefined

    const responseBody = schema.response?.body
        ? Object.fromEntries(
              Object.entries(schema.response.body).map(([status, responseSchema]) => {
                  const normalizedStatus = status === 'default' ? status : Number(status)
                  return [normalizedStatus, toJsonSchema(responseSchema as z.ZodTypeAny)]
              }),
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
    defaults: ZodRouteHelperDefaults,
    schema: ZodRouteSchemaInput<any, any, any, any> | undefined,
): ZodRouteSchemaInput<any, any, any, any> | undefined {
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

function mergeZodOptions<
    Options extends { schema?: ZodRouteSchemaInput<any, any, any, any> | undefined },
>(defaults: ZodRouteHelperDefaults, options: Options): Options {
    const schema = mergeRouteSchema(defaults, options.schema)
    return {
        ...defaults,
        ...options,
        ...(schema === undefined ? {} : { schema }),
    } as Options
}

function hasRoutePath(options: unknown): options is { path: unknown } {
    return (options as { path?: unknown }).path !== undefined
}

function isSkippableResponseValidationValue(value: unknown): boolean {
    return (
        value instanceof ReadableStream ||
        value instanceof Uint8Array ||
        (typeof Buffer !== 'undefined' && value instanceof Buffer) ||
        (!!value && typeof value === 'object' && Symbol.asyncIterator in value)
    )
}

function jsonValuesEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) return true
    if (typeof left !== typeof right) return false
    if (!left || !right || typeof left !== 'object') return false
    if (Array.isArray(left) || Array.isArray(right)) {
        return (
            Array.isArray(left) &&
            Array.isArray(right) &&
            left.length === right.length &&
            left.every((value, index) => jsonValuesEqual(value, right[index]))
        )
    }

    const leftEntries = Object.entries(left)
    const rightRecord = right as Record<string, unknown>
    const rightKeys = new Set(Object.keys(rightRecord))
    return (
        leftEntries.length === rightKeys.size &&
        leftEntries.every(
            ([key, value]) => rightKeys.has(key) && jsonValuesEqual(value, rightRecord[key]),
        )
    )
}

function getResponseSchemaForStatus(
    schema: ZodRouteSchemaInput<any, any, any, any> | undefined,
    status: number,
): z.ZodTypeAny | undefined {
    return schema?.response?.body?.[status] ?? schema?.response?.body?.default
}

async function readResponseBodyForValidation(
    response: Response,
): Promise<ResponseBodyForValidation | undefined> {
    if (!response.body) return undefined
    const contentType = response.headers.get('content-type') ?? ''
    const clone = response.clone()
    if (contentType.includes('application/json') || /\+json\b/i.test(contentType)) {
        return {
            value: await clone.json(),
            writableJson: true,
        }
    }
    return {
        value: await clone.text(),
        writableJson: false,
    }
}

function responseWithJsonBody(response: Response, value: unknown): Response {
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json')
    }
    return new Response(value === undefined ? undefined : JSON.stringify(value), {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}

function parseResponseSchema(
    schema: ZodRouteSchemaInput<any, any, any, any> | undefined,
    status: number,
    value: unknown,
    mode: ResponseValidationMode,
): unknown {
    const responseSchema = getResponseSchemaForStatus(schema, status)
    if (!responseSchema) return value
    const result = responseSchema.safeParse(value)
    if (!result.success) {
        throw new ZodResponseValidationError(status, result.error)
    }
    if (mode === 'strict' && !jsonValuesEqual(value, result.data)) {
        throw new ZodResponseValidationError(
            status,
            new z.ZodError([
                {
                    code: z.ZodIssueCode.custom,
                    path: [],
                    message: 'Response body does not match the parsed schema output.',
                },
            ]),
        )
    }
    return mode === 'parse' ? result.data : value
}

async function validateHandlerResult(
    schema: ZodRouteSchemaInput<any, any, any, any> | undefined,
    result: unknown,
    mode: ResponseValidationMode,
): Promise<unknown> {
    if (result instanceof Response) {
        const body = await readResponseBodyForValidation(result)
        if (!body) return result
        const parsed = parseResponseSchema(schema, result.status, body.value, mode)
        return mode === 'parse' && body.writableJson ? responseWithJsonBody(result, parsed) : result
    }
    if (isRoutekitResponse(result)) {
        const parsed = parseResponseSchema(schema, result.status, result.body, mode)
        return mode === 'parse'
            ? response(parsed, { status: result.status, headers: result.headers })
            : result
    }
    if (isRoutekitBody(result)) {
        const parsed = parseResponseSchema(schema, HttpStatus.OK, result.value, mode)
        return mode === 'parse' ? parsed : result
    }
    if (isSkippableResponseValidationValue(result)) {
        return result
    }
    return parseResponseSchema(schema, HttpStatus.OK, result, mode)
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
>(
    options: ZodHandlerOptions<Schema, Ctx>,
): Handler<InferResponseBody<ExtractResponseBodySchemas<Schema>>, Ctx> {
    const resolved = resolveDefaults(options)

    return async function (this: Router<any>, ctx: HandlerContext<Ctx>) {
        const run = async (): Promise<
            HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
        > => {
            const validateAndReturn = async (
                result: HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
            ): Promise<HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>> => {
                if (resolved.validateResponse !== false) {
                    return (await validateHandlerResult(
                        resolved.schema,
                        result,
                        resolved.validateResponse,
                    )) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>
                }
                return result
            }
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
                    return await validateAndReturn(
                        resolved.validationError(
                            ValidationError.QUERY_PARAMETERS,
                            queryResult.error,
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                handlerContext.params.query = queryResult.data as InferSchema<
                    ExtractQuerySchema<Schema>
                >
            }

            if (bodySchema) {
                let rawBody: unknown
                try {
                    rawBody = await readRequestBody(ctx.req)
                } catch (err) {
                    return await validateAndReturn(
                        resolved.validationError(
                            ValidationError.REQUEST_BODY,
                            zodErrorFromThrowable(err),
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                const bodyResult = bodySchema.safeParse(rawBody)
                if (!bodyResult.success) {
                    return await validateAndReturn(
                        resolved.validationError(
                            ValidationError.REQUEST_BODY,
                            bodyResult.error,
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                handlerContext.params.body = bodyResult.data as InferSchema<
                    ExtractBodySchema<Schema>
                >
            }

            if (pathSchema) {
                const pathResult = pathSchema.safeParse(ctx.pathParams)
                if (!pathResult.success) {
                    return await validateAndReturn(
                        resolved.validationError(
                            ValidationError.URL_PATH,
                            pathResult.error,
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                handlerContext.params.path = pathResult.data as InferSchema<
                    ExtractPathSchema<Schema>
                >
            }

            const result = await resolved.handler.call(this, handlerContext)
            return await validateAndReturn(result)
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
>(
    options: ZodHandlerOptions<Schema, Ctx>,
): {
    handler: Handler<InferResponseBody<ExtractResponseBodySchemas<Schema>>, Ctx>
    schema?: RouteSchema
} {
    const schema = buildRouteSchema(options.schema)
    return {
        handler: zodHandler(options),
        ...(schema ? { schema } : {}),
    }
}

/**
 * Build method-specific route options that validate inputs with Zod and expose JSON Schema metadata.
 *
 * @example
 * ```ts
 * router.post('/users/:id', withZod({
 *   name: 'user.update',
 *   schema: {
 *     request: {
 *       path: z.object({id: z.string()}),
 *       body: z.object({name: z.string()}),
 *     },
 *   },
 *   handler: ({params}) => ({id: params.path.id, name: params.body.name}),
 * }))
 * ```
 *
 * @param options - Method route options extended with Zod request and response schemas.
 * @returns Route options compatible with method-specific router helpers.
 */
export function withZod<
    Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
    Ctx extends object = AnyContext,
>(options: WithZodOptions<Schema, Ctx>): RouteOptions<Ctx> {
    const { schema, handler, validationError, validateResponse, ...routeOptions } = options
    const partial = zodPartial<Schema, Ctx>({
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
 * Create a Zod route builder with shared defaults.
 *
 * @example
 * ```ts
 * const zod = createZodRoutes({
 *   validateResponse: false,
 *   schema: {
 *     response: {
 *       body: {
 *         400: z.object({message: z.string()}),
 *       },
 *     },
 *   },
 * })
 *
 * router.post('/users/:id', zod({
 *   name: 'user.update',
 *   schema: {
 *     request: {
 *       path: z.object({id: z.string()}),
 *     },
 *   },
 *   handler: ({params}) => ({id: params.path.id}),
 * }))
 * ```
 *
 * @param defaults - Default schema fragments, response validation, and request validation error handling.
 * @returns A route-options builder compatible with method-specific router helpers.
 */
export function createZodRoutes(defaults: ZodRouteHelperDefaults = {}): ZodRoutes {
    return (<
        Schema extends ZodRouteSchemaInput<any, any, any, any> | undefined,
        Ctx extends object = AnyContext,
    >(
        options: ZodRouteOptions<Schema, Ctx> | WithZodOptions<Schema, Ctx>,
    ): Route<Ctx> | RouteOptions<Ctx> => {
        const merged = mergeZodOptions(defaults, options)
        if (hasRoutePath(merged)) {
            return zodRoute(merged as ZodRouteOptions<Schema, Ctx>)
        }
        return withZod(merged as WithZodOptions<Schema, Ctx>)
    }) as ZodRoutes
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
    const { schema, handler, validationError, validateResponse, ...route } = options
    const partial = zodPartial<Schema, Ctx>({
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
