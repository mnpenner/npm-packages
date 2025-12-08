import {NeverjectPromise, ok, err, errAsync, nj, Result} from 'neverject'
import {isResult} from 'neverject/result'
import {ZodType, z} from 'zod'
import {HttpStatus} from './http-enums'
import {HeadersInit} from 'bun'

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

function zodValidationError<T>(component: ValidationError, error: z.ZodError): NeverjectPromise<T, RawError> {
    return errAsync({
        type: ServerErrorCode.VALIDATION_ERROR,
        component,
        errorTree: z.treeifyError(error),
        message: z.prettifyError(error),
    } as const) as NeverjectPromise<T, RawError>
}

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
    url: string
    headers: Headers
    body: TBody
    pathParams: TPathParams
    queryParams: TQueryParams
    method: string
}

export type MaybePromise<T> = T | PromiseLike<T>
export type NormalizedResponse<V, E> = NeverjectPromise<V, E> | MaybePromise<Result<V | never, E> | V>

export type Handler<TReqBody, TReqPath, TReqQuery, TOkRes> = (req: ServerRequest<TReqBody, TReqPath, TReqQuery>) => NeverjectPromise<Response, RawError>

export type ZodHandler<TReqBody, TReqPath, TReqQuery, TOkRes> = (req: ServerRequest<TReqBody, TReqPath, TReqQuery>) => NeverjectPromise<ServerResponse<TOkRes>, RawError> | MaybePromise<Result<ServerResponse<TOkRes>, RawError> | ServerResponse<TOkRes>>

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
    handler: ZodHandler<
        BodySchema extends ZodType ? z.infer<BodySchema> : unknown,
        PathSchema extends ZodType ? z.infer<PathSchema> : unknown,
        QuerySchema extends ZodType ? z.infer<QuerySchema> : unknown,
        Success
    >;
};

function toResponse<T>(res: ServerResponse<T>): Response {
    const headers = new Headers(res.headers ?? {})
    headers.set('content-type', 'application/json')

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

export function createZodNeverjectHandler<
    QuerySchema extends ZodType | undefined,
    BodySchema extends ZodType | undefined,
    PathSchema extends ZodType | undefined,
    Success,
    Error,
>(options: CreateZodHandlerOptions<QuerySchema, BodySchema, PathSchema, Success, Error>): Handler<
    BodySchema extends ZodType ? z.infer<BodySchema> : unknown,
    PathSchema extends ZodType ? z.infer<PathSchema> : unknown,
    QuerySchema extends ZodType ? z.infer<QuerySchema> : unknown,
    Success
> {
    return  (req) => {
        if (options.query) {
            const queryResult = options.query.safeParse(req.queryParams)
            if (!queryResult.success) {
                return zodValidationError(ValidationError.QUERY, queryResult.error)
            }
            (req.queryParams as any) = queryResult.data
        }

        if (options.body) {
            const bodyResult = options.body.safeParse(req.body)
            if (!bodyResult.success) {
                return zodValidationError(ValidationError.BODY, bodyResult.error)
            }
            (req.body as any) = bodyResult.data
        }

        if (options.path) {
            const pathResult = options.path.safeParse(req.pathParams)
            if (!pathResult.success) {
                return zodValidationError(ValidationError.PATH, pathResult.error)
            }
            (req.pathParams as any) = pathResult.data
        }

        return nj((async () => {
            try {
                const handlerResult = await options.handler(req as any)
                if (isResult(handlerResult)) {
                    const result = handlerResult as any
                    if (result.ok) {
                        return ok(toResponse(result.value as ServerResponse<Success>))
                    }
                    return err(result.error as RawError)
                }
                return ok(toResponse(handlerResult as ServerResponse<Success>))
            } catch (unhandledErr) {
                return err<RawError>({
                    type: ServerErrorCode.HANDLER_RESPONSE,
                    error: String(unhandledErr),
                })
            }
        })())
    }
}
