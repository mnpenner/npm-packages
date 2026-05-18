import { HttpStatus } from '@mpen/http'
import { toJsonSchema, type ConversionConfig } from '@valibot/to-json-schema'
import type { Router } from '../../router'
import type {
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
import * as v from 'valibot'

/**
 * Validation error component identifiers for Valibot-backed routes.
 */
export const enum ValibotValidationError {
    REQUEST_BODY,
    URL_PATH,
    QUERY_PARAMETERS,
}

type AnyValibotSchema = v.GenericSchema
type ValibotSchema = AnyValibotSchema | undefined
type ValibotObjectSchema = v.ObjectSchema<
    v.ObjectEntries,
    v.ErrorMessage<v.ObjectIssue> | undefined
>
type ValibotPathSchema = ValibotObjectSchema | undefined
type AnyValibotResponseBodySchemas = Partial<Record<number | 'default', AnyValibotSchema>>
type ValibotResponseBodySchemas = AnyValibotResponseBodySchemas | undefined
type ResponseValidationMode = false | 'strict' | 'parse'
type ResponseValidationOption = boolean | ResponseValidationMode
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
    PathSchema extends ValibotPathSchema = undefined,
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

type AnyValibotRouteSchemaInput = ValibotRouteSchemaInput<
    AnyValibotSchema,
    ValibotObjectSchema,
    AnyValibotSchema,
    AnyValibotResponseBodySchemas
>

type InferSchema<Schema extends ValibotSchema> = Schema extends v.GenericSchema
    ? v.InferOutput<Schema>
    : unknown

type InferResponseBodySchemaUnion<ResponseBodySchemas extends AnyValibotResponseBodySchemas> = [
    keyof ResponseBodySchemas,
] extends [never]
    ? unknown
    : {
          [Status in keyof ResponseBodySchemas]: NonNullable<
              ResponseBodySchemas[Status]
          > extends AnyValibotSchema
              ? v.InferInput<NonNullable<ResponseBodySchemas[Status]>>
              : never
      }[keyof ResponseBodySchemas]

type InferResponseBody<ResponseBodySchemas extends ValibotResponseBodySchemas> =
    ResponseBodySchemas extends AnyValibotResponseBodySchemas
        ? 200 extends keyof ResponseBodySchemas
            ? InferResponseBodySchemaUnion<ResponseBodySchemas>
            : 'default' extends keyof ResponseBodySchemas
              ? InferResponseBodySchemaUnion<ResponseBodySchemas>
              : unknown
        : unknown

type NormalizeSchema<Schema> = Schema extends AnyValibotRouteSchemaInput
    ? Schema
    : ValibotRouteSchemaInput<undefined, undefined, undefined, undefined>

type ExtractBodySchema<Schema extends AnyValibotRouteSchemaInput | undefined> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<
        infer BodySchema,
        infer _PathSchema,
        infer _QuerySchema,
        infer _ResponseBodySchemas
    >
        ? BodySchema
        : undefined

type ExtractPathSchema<Schema extends AnyValibotRouteSchemaInput | undefined> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<
        infer _BodySchema,
        infer PathSchema,
        infer _QuerySchema,
        infer _ResponseBodySchemas
    >
        ? PathSchema
        : undefined

type ExtractQuerySchema<Schema extends AnyValibotRouteSchemaInput | undefined> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<
        infer _BodySchema,
        infer _PathSchema,
        infer QuerySchema,
        infer _ResponseBodySchemas
    >
        ? QuerySchema
        : undefined

type ExtractResponseBodySchemas<Schema extends AnyValibotRouteSchemaInput | undefined> =
    NormalizeSchema<Schema> extends ValibotRouteSchemaInput<
        infer _BodySchema,
        infer _PathSchema,
        infer _QuerySchema,
        infer ResponseBodySchemas
    >
        ? ResponseBodySchemas
        : undefined

/**
 * Validated request inputs exposed to a Valibot-backed handler.
 */
export type ValibotHandlerParams<
    BodySchema extends ValibotSchema,
    PathSchema extends ValibotPathSchema,
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
    PathSchema extends ValibotPathSchema,
    QuerySchema extends ValibotSchema,
    Ctx extends object,
> = Omit<HandlerContext<Ctx>, 'pathParams'> &
    ValibotHandlerParams<BodySchema, PathSchema, QuerySchema> & {
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
    schema?: AnyValibotRouteSchemaInput
    /**
     * Whether and how to apply `schema.response.body` to handler responses.
     * `false` disables response validation, `true` and `'strict'` validate without changing the
     * response body, and `'parse'` returns the parsed response body. Defaults to `'parse'`.
     */
    validateResponse?: ResponseValidationOption
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
    PathSchema extends ValibotPathSchema,
    QuerySchema extends ValibotSchema,
    ResponseBodySchemas extends ValibotResponseBodySchemas,
    Ctx extends object = object,
> = (
    this: Router<any>,
    ctx: ValibotHandlerContext<BodySchema, PathSchema, QuerySchema, Ctx>,
) => HandlerResult<InferResponseBody<ResponseBodySchemas>>

/**
 * Shared options used by `valibotHandler` and `valibotPartial`.
 */
export type ValibotHandlerOptions<
    Schema extends AnyValibotRouteSchemaInput | undefined,
    Ctx extends object = object,
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
    Schema extends AnyValibotRouteSchemaInput | undefined,
    Ctx extends object = object,
> = Omit<Route<Ctx>, 'handler' | 'schema'> & ValibotHandlerOptions<Schema, Ctx>

/**
 * Method-specific route options used by `withValibot`.
 */
export type WithValibotOptions<
    Schema extends AnyValibotRouteSchemaInput | undefined,
    Ctx extends object = object,
> = Omit<RouteOptions<Ctx>, 'handler' | 'schema'> & ValibotHandlerOptions<Schema, Ctx>

/**
 * Valibot route builder created by [`createValibotRouteBuilder`]{@link createValibotRouteBuilder}.
 *
 * @example
 * ```ts
 * const route = createValibotRouteBuilder()
 *
 * router.get('/users/:id', route({
 *   schema: {
 *     request: {
 *       path: v.object({id: v.string()}),
 *     },
 *   },
 *   handler: ({path}) => ({id: path.id}),
 * }))
 *
 * router.add(route({
 *   method: HttpMethod.GET,
 *   path: '/health',
 *   handler: () => ({ok: true}),
 * }))
 * ```
 */
export type ValibotRouteBuilder = {
    /**
     * Build a full route definition that includes its own path.
     *
     * @param options - Full route options including `path`.
     * @returns A full route definition compatible with [`Router.add`]{@link Router#add}.
     */
    <Schema extends AnyValibotRouteSchemaInput | undefined, Ctx extends object = object>(
        options: ValibotRouteOptions<Schema, Ctx>,
    ): Route<Ctx>
    /**
     * Build method-specific route options that leave the path to the registering router.
     *
     * @param options - Method route options without a route path.
     * @returns Route options compatible with helpers like [`Router.get`]{@link Router#get}.
     */
    <Schema extends AnyValibotRouteSchemaInput | undefined, Ctx extends object = object>(
        options: WithValibotOptions<Schema, Ctx>,
    ): RouteOptions<Ctx>
}

type ResolvedValibotHandlerOptions<
    Schema extends AnyValibotRouteSchemaInput | undefined,
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
    validateResponse: ResponseValidationMode
    validationError: ValibotValidationErrorHandler
}

type ResponseBodyForValidation = {
    value: unknown
    writableJson: boolean
}

const validationErrorComponentName = new Map<
    ValibotValidationError,
    ValibotValidationErrorBody['component']
>([
    [ValibotValidationError.REQUEST_BODY, 'request_body'],
    [ValibotValidationError.URL_PATH, 'url_path'],
    [ValibotValidationError.QUERY_PARAMETERS, 'query_parameters'],
])

const jsonSchemaApproximationConfig = {
    target: 'draft-07',
    errorMode: 'ignore',
} satisfies Pick<ConversionConfig, 'target' | 'errorMode'>

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
): HandlerResult {
    const payload: ValibotValidationErrorBody = {
        component: validationErrorComponentName.get(component) ?? 'request_body',
        issues,
        message: v.summarize(issues),
    }
    return response(payload, { status: HttpStatus.BAD_REQUEST })
}

function normalizeResponseValidationMode(
    option: ResponseValidationOption | undefined,
): ResponseValidationMode | undefined {
    if (option === true) return 'strict'
    return option
}

function resolveDefaults<Schema extends AnyValibotRouteSchemaInput | undefined, Ctx extends object>(
    options: ValibotHandlerOptions<Schema, Ctx>,
    defaults?: ValibotRouteHelperDefaults,
): ResolvedValibotHandlerOptions<Schema, Ctx> {
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
    return sanitizeJsonSchema(
        toJsonSchema(schema, { ...jsonSchemaApproximationConfig, typeMode: 'input' }) as JsonSchema,
    )
}

function toResponseJsonSchema(schema: v.GenericSchema): JsonSchema {
    return sanitizeJsonSchema(
        toJsonSchema(schema, {
            ...jsonSchemaApproximationConfig,
            typeMode: 'output',
        }) as JsonSchema,
    )
}

function buildRouteSchema(schema?: AnyValibotRouteSchemaInput): RouteSchema | undefined {
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
              Object.entries(schema.response.body).map(([status, responseSchema]) => {
                  const normalizedStatus = status === 'default' ? status : Number(status)
                  return [normalizedStatus, toResponseJsonSchema(responseSchema as v.GenericSchema)]
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
    defaults: ValibotRouteHelperDefaults,
    schema: AnyValibotRouteSchemaInput | undefined,
): AnyValibotRouteSchemaInput | undefined {
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

function mergeValibotOptions<Options extends { schema?: AnyValibotRouteSchemaInput | undefined }>(
    defaults: ValibotRouteHelperDefaults,
    options: Options,
): Options {
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
    schema: AnyValibotRouteSchemaInput | undefined,
    status: number,
): v.GenericSchema | undefined {
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
    schema: AnyValibotRouteSchemaInput | undefined,
    status: number,
    value: unknown,
    mode: ResponseValidationMode,
): unknown {
    const responseSchema = getResponseSchemaForStatus(schema, status)
    if (!responseSchema) return value
    const result = v.safeParse(responseSchema, value)
    if (!result.success) {
        throw new ValibotResponseValidationError(status, result.issues)
    }
    if (mode === 'strict' && !jsonValuesEqual(value, result.output)) {
        throw new ValibotResponseValidationError(
            status,
            valibotIssuesFromThrowable(
                new Error('Response body does not match the parsed schema output.'),
            ),
        )
    }
    return mode === 'parse' ? result.output : value
}

async function validateHandlerResult(
    schema: AnyValibotRouteSchemaInput | undefined,
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
 *   handler: ({path}) => ({id: path.id}),
 * })
 * ```
 *
 * @param options - Handler definition extended with request and response Valibot schemas.
 * @returns A handler that validates request inputs before invoking the provided handler.
 */
export function valibotHandler<
    Schema extends AnyValibotRouteSchemaInput | undefined,
    Ctx extends object = object,
>(
    options: ValibotHandlerOptions<Schema, Ctx>,
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

            const handlerParams = {
                path: ctx.pathParams as InferSchema<ExtractPathSchema<Schema>>,
                query: undefined as InferSchema<ExtractQuerySchema<Schema>>,
                body: undefined as InferSchema<ExtractBodySchema<Schema>>,
            }
            const handlerContext = {
                ...ctx,
                ...handlerParams,
                params: handlerParams,
            } as ValibotHandlerContext<
                ExtractBodySchema<Schema>,
                ExtractPathSchema<Schema>,
                ExtractQuerySchema<Schema>,
                Ctx
            >

            if (querySchema) {
                const queryResult = v.safeParse(querySchema, queryParams)
                if (!queryResult.success) {
                    return await validateAndReturn(
                        resolved.validationError(
                            ValibotValidationError.QUERY_PARAMETERS,
                            queryResult.issues,
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                handlerContext.params.query = queryResult.output as InferSchema<
                    ExtractQuerySchema<Schema>
                >
                handlerContext.query = handlerContext.params.query
            }

            if (bodySchema) {
                let rawBody: unknown
                try {
                    rawBody = await readRequestBody(ctx.req)
                } catch (err) {
                    return await validateAndReturn(
                        resolved.validationError(
                            ValibotValidationError.REQUEST_BODY,
                            valibotIssuesFromThrowable(err),
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                const bodyResult = v.safeParse(bodySchema, rawBody)
                if (!bodyResult.success) {
                    return await validateAndReturn(
                        resolved.validationError(
                            ValibotValidationError.REQUEST_BODY,
                            bodyResult.issues,
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                handlerContext.params.body = bodyResult.output as InferSchema<
                    ExtractBodySchema<Schema>
                >
                handlerContext.body = handlerContext.params.body
            }

            if (pathSchema) {
                const pathResult = v.safeParse(pathSchema, ctx.pathParams)
                if (!pathResult.success) {
                    return await validateAndReturn(
                        resolved.validationError(
                            ValibotValidationError.URL_PATH,
                            pathResult.issues,
                        ) as HandlerResult<InferResponseBody<ExtractResponseBodySchemas<Schema>>>,
                    )
                }
                handlerContext.params.path = pathResult.output as InferSchema<
                    ExtractPathSchema<Schema>
                >
                handlerContext.path = handlerContext.params.path
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
 * @param options - Valibot-backed handler definition with optional request and response schemas.
 * @returns The validated handler and generated route `schema`.
 */
export function valibotPartial<
    Schema extends AnyValibotRouteSchemaInput | undefined,
    Ctx extends object = object,
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
 *   handler: ({path, body}) => ({id: path.id, name: body.name}),
 * }))
 * ```
 *
 * @param options - Method route options extended with Valibot request and response schemas.
 * @returns Route options compatible with method-specific router helpers.
 */
export function withValibot<
    Schema extends AnyValibotRouteSchemaInput | undefined,
    Ctx extends object = object,
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
 * const valibotRoute = createValibotRouteBuilder({
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
 * router.post('/users/:id', valibotRoute({
 *   name: 'user.update',
 *   schema: {
 *     request: {
 *       path: v.object({id: v.string()}),
 *     },
 *   },
 *   handler: ({path}) => ({id: path.id}),
 * }))
 * ```
 *
 * @param defaults - Default schema fragments, response validation, and request validation error handling.
 * @returns A route builder compatible with method-specific router helpers and full route definitions.
 */
export function createValibotRouteBuilder(
    defaults: ValibotRouteHelperDefaults = {},
): ValibotRouteBuilder {
    return (<Schema extends AnyValibotRouteSchemaInput | undefined, Ctx extends object = object>(
        options: ValibotRouteOptions<Schema, Ctx> | WithValibotOptions<Schema, Ctx>,
    ): Route<Ctx> | RouteOptions<Ctx> => {
        const merged = mergeValibotOptions(defaults, options)
        if (hasRoutePath(merged)) {
            return valibotRoute(merged as ValibotRouteOptions<Schema, Ctx>)
        }
        return withValibot(merged as WithValibotOptions<Schema, Ctx>)
    }) as ValibotRouteBuilder
}

/**
 * Build a full route definition that validates inputs with Valibot and exposes JSON Schema metadata.
 *
 * @param options - Route definition extended with Valibot request and response schemas.
 * @returns A route compatible with the core router.
 */
export function valibotRoute<
    Schema extends AnyValibotRouteSchemaInput | undefined,
    Ctx extends object = object,
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
