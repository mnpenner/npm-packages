import type {Result} from 'neverject'
import {isResult} from 'neverject/result'
import {ZodType, z} from 'zod'
import {HttpStatus} from '@mpen/http-helpers'
import type {Handler, RequestContext} from '@mpen/server-router'

/**
 * Should roughly map to HTTP status codes but with more granularity.
 */
export const enum ServerErrorCode {
    REQUEST_FORMAT,
    VALIDATION_ERROR,
    HANDLER_RESPONSE,
}

type ErrorTree = ReturnType<typeof z.treeifyError>

export const serverErrorToHttpStatus = new Map<ServerErrorCode, HttpStatus>([
    [ServerErrorCode.REQUEST_FORMAT, HttpStatus.BAD_REQUEST],
    [ServerErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST],
    [ServerErrorCode.HANDLER_RESPONSE, HttpStatus.INTERNAL_SERVER_ERROR],
])

export type RawError =
    | { type: ServerErrorCode.REQUEST_FORMAT, error: string }
    | { type: ServerErrorCode.HANDLER_RESPONSE, error: string }
    | { type: ServerErrorCode.VALIDATION_ERROR, component: ValidationError, errorTree: ErrorTree, message: string }

/**
 * Specific component that failed validation.
 */
export const enum ValidationError {
    BODY,
    PATH,
    QUERY,
}

export interface ServerResponse<T> {
    body: T
    status?: number
    headers?: HeadersInit
}

export interface ServerRequest<TBody, TPathParams, TQueryParams> {
    request: Request
    url: string
    headers: Headers
    body: TBody
    pathParams: TPathParams
    queryParams: TQueryParams
    method: string
}

export type MaybePromise<T> = T | PromiseLike<T>

export type ZodHandler<TReqBody, TReqPath, TReqQuery, TOkRes, TErr> =
    (req: ServerRequest<TReqBody, TReqPath, TReqQuery>) =>
        | MaybePromise<Result<ServerResponse<TOkRes> | Response, TErr> | ServerResponse<TOkRes> | Response>

export type CreateZodHandlerOptions<
    QuerySchema extends ZodType | undefined,
    BodySchema extends ZodType | undefined,
    PathSchema extends ZodType | undefined,
    Success,
    Error,
> = {
    query?: QuerySchema;
    body?: BodySchema;
    path?: PathSchema;
    exec: ZodHandler<
        BodySchema extends ZodType ? z.infer<BodySchema> : unknown,
        PathSchema extends ZodType ? z.infer<PathSchema> : unknown,
        QuerySchema extends ZodType ? z.infer<QuerySchema> : unknown,
        Success,
        Error
    >;
};

function toResponse<T>(res: ServerResponse<T>): Response {
    const headers = new Headers(res.headers ?? {})
    headers.set('content-type', headers.get('content-type') ?? 'application/json')

    return new Response(JSON.stringify(res.body), {
        status: res.status ?? 200,
        headers,
    })
}

export function rawErrorToResponse(errValue: RawError): Response {
    const status = serverErrorToHttpStatus.get(errValue.type) ?? HttpStatus.INTERNAL_SERVER_ERROR
    return new Response(JSON.stringify(errValue), {
        status,
        headers: {
            'content-type': 'application/json',
        },
    })
}

function zodValidationError(component: ValidationError, error: z.ZodError): RawError {
    return {
        type: ServerErrorCode.VALIDATION_ERROR,
        component,
        errorTree: z.treeifyError(error),
        message: z.prettifyError(error),
    } as const
}

async function parseRequestBody(request: Request): Promise<unknown> {
    if (!request.body) return undefined

    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
        return await request.json()
    }
    return await request.text()
}

export function createZodNeverjectHandler<
    QuerySchema extends ZodType | undefined,
    BodySchema extends ZodType | undefined,
    PathSchema extends ZodType | undefined,
    Success,
    Error = RawError,
>(options: CreateZodHandlerOptions<QuerySchema, BodySchema, PathSchema, Success, Error>): Handler<Success> {
    return async (ctx: RequestContext) => {
        const queryParams: unknown = ctx.queryParams
        const pathParams: unknown = ctx.pathParams
        let body: unknown = ctx.body

        if (options.query) {
            const queryResult = options.query.safeParse(queryParams)
            if (!queryResult.success) {
                return rawErrorToResponse(zodValidationError(ValidationError.QUERY, queryResult.error))
            }
            ;(ctx.queryParams as any) = queryResult.data
        }

        if (options.body) {
            try {
                body = await parseRequestBody(ctx.request)
            } catch (e) {
                return rawErrorToResponse({
                    type: ServerErrorCode.REQUEST_FORMAT,
                    error: String(e),
                })
            }

            const bodyResult = options.body.safeParse(body)
            if (!bodyResult.success) {
                return rawErrorToResponse(zodValidationError(ValidationError.BODY, bodyResult.error))
            }
            ;(ctx.body as any) = bodyResult.data
        }

        if (options.path) {
            const pathResult = options.path.safeParse(pathParams)
            if (!pathResult.success) {
                return rawErrorToResponse(zodValidationError(ValidationError.PATH, pathResult.error))
            }
            ;(ctx.pathParams as any) = pathResult.data
        }

        const serverReq: ServerRequest<any, any, any> = {
            request: ctx.request,
            url: ctx.url.toString(),
            headers: ctx.headers,
            body: ctx.body,
            pathParams: ctx.pathParams,
            queryParams: ctx.queryParams,
            method: ctx.method,
        }

        try {
            const handlerResult = await options.exec(serverReq as any)
            if (handlerResult instanceof Response) return handlerResult

            if (isResult(handlerResult)) {
                const result = handlerResult as any
                if (result.ok) {
                    const value = result.value as any
                    return value instanceof Response ? value : toResponse(value as ServerResponse<Success>)
                }
                const error = result.error as any
                return error && typeof error === 'object' && 'type' in error
                    ? rawErrorToResponse(error as RawError)
                    : rawErrorToResponse({
                        type: ServerErrorCode.HANDLER_RESPONSE,
                        error: String(error),
                    })
            }

            return toResponse(handlerResult as ServerResponse<Success>)
        } catch (unhandledErr) {
            return rawErrorToResponse({
                type: ServerErrorCode.HANDLER_RESPONSE,
                error: String(unhandledErr),
            })
        }
    }
}
