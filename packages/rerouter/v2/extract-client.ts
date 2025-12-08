import {URLPattern} from 'urlpattern-polyfill'
import {NeverjectPromise, okAsync, errAsync, nj, err, Result, ok} from 'neverject'
import {isResult} from 'neverject/result'
import {ZodType, z} from 'zod'
import {HttpStatus} from './http-enums'

/**
 * Should roughly map to HTTP status codes but with more granularity.
 */
export const enum ServerErrorCode {
    REQUEST_FORMAT,
    VALIDATION_ERROR,
    HANDLER_RESPONSE,
}

type ErrorTree = ReturnType<typeof z.treeifyError>

const serverErrorToHttpStatus = new Map<ServerErrorCode, HttpStatus>([
    [ServerErrorCode.REQUEST_FORMAT, HttpStatus.BAD_REQUEST],
    [ServerErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST],
])

type RawError =
    | { type: ServerErrorCode.REQUEST_FORMAT, error: string }
    | { type: ServerErrorCode.HANDLER_RESPONSE, error: string }
    | { type: ServerErrorCode.VALIDATION_ERROR, component: ValidationError, errorTree: ErrorTree, message: string }  // TODO: maybe don't bake the Zod Error tree format into this...?

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

interface ServerResponse<T> {
    // status: number
    body: T
}

interface ServerRequest<TBody,TPathParams,TQueryParams> {
    url: string
    headers: Headers
    body: TBody
    pathParams: TPathParams
    queryParams: TQueryParams
    method: string
}

// TODO: allow for streaming responses

function serverError(e: RawError) {
    return errAsync(e)
}

export type MaybePromise<T> = T | PromiseLike<T>
type NormalizedResponse<V, E> = NeverjectPromise<V, E> | MaybePromise<Result<V | never, E> | V>

type Handler<TReqBody, TReqPath, TReqQuery, TOkRes> = (req: ServerRequest<TReqBody, TReqPath, TReqQuery>) => NeverjectPromise<ServerResponse<TOkRes>,RawError>

type ZodHandler<TReqBody, TReqPath, TReqQuery, TOkRes> = (req: ServerRequest<TReqBody, TReqPath, TReqQuery>) => NeverjectPromise<ServerResponse<TOkRes>,RawError> | MaybePromise<Result<ServerResponse<TOkRes>, RawError>>

type CreateZodHandlerOptions<
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

function createZodHandler<
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
        // Validate query params
        if (options.query) {
            const queryResult = options.query.safeParse(req.queryParams)
            if (!queryResult.success) {
                return zodValidationError(ValidationError.QUERY, queryResult.error)
            }
            (req.queryParams as any) = queryResult.data
        }

        // Validate body
        if (options.body) {
            const bodyResult = options.body.safeParse(req.body)
            if (!bodyResult.success) {
                return zodValidationError(ValidationError.BODY, bodyResult.error)
            }
            (req.body as any) = bodyResult.data
        }

        // Validate path params
        if (options.path) {
            const pathResult = options.path.safeParse(req.pathParams)
            if (!pathResult.success) {
                return zodValidationError(ValidationError.PATH, pathResult.error)
            }
            (req.pathParams as any) = pathResult.data
        }

        // FIXME: this is messier than it should be
        return nj((async () => {
            try {
                const handlerResult = await options.handler(req as any)
                if (isResult(handlerResult)) {
                    return handlerResult
                }
                return ok(handlerResult as ServerResponse<Success>)
            } catch (unhandledErr) {
                return err<RawError>({
                    type: ServerErrorCode.HANDLER_RESPONSE,
                    error: String(unhandledErr),  // TODO: include more detail
                })
            }
        })())
    }
}


interface Route {
    name?: string
    pattern: string|URLPattern
    handler: Handler<any, any, any, any>
    method: string
}

interface NormalizedRoute {
    name: string
    pattern: URLPattern
    handler: Handler<any, any, any, any>
    method: string
}

function upperFirst(str: string): string {
    return str.slice(0,1).toUpperCase() + str.slice(1)
}

function pattToName(method: string, patt: URLPattern): string {
    // ALTERNATIVE: each path part could become nested (/foo/bar/baz becomes .foo.bar.baz.get)
    // OR: make this an option to the router, like "flatten"
    const pathname = patt.pathname
    const parts = pathname.split('/').filter(p => p.length > 0)

    if (parts.length === 0) {
        return method.toLowerCase() + 'Index'
    }

    const cleaned = parts.map(part => {
        // Replace :paramName with $paramName, handling regex patterns
        return part.replace(/:([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '$$$1')
    }).map(part => part.replace(/[^a-zA-Z0-9_$]/g, ''))
    const capitalized = cleaned.map(upperFirst)
    return method.toLowerCase() + capitalized.join('')
}

function normalizeRoute(route: Route): NormalizedRoute {
    const pattern = typeof route.pattern === 'string' ? new URLPattern({ pathname: route.pattern }) : route.pattern
    return {
        name: route.name ?? pattToName(route.method, pattern),
        pattern: pattern,
        handler: route.handler,
        method: route.method
    }
}

class Router {
    private routes: NormalizedRoute[] = []

    add(route: Route) {
        this.routes.push(normalizeRoute(route))
    }
}


if(import.meta.main) {
    const router = new Router()

    router.add({
        pattern: '/',
        handler: createZodHandler({
            handler: (req) => okAsync({
                body: { message: 'Hello World!' }
            })
        }),
        method: 'GET'
    })

    router.add({
        pattern: '/books/:id',
        handler: createZodHandler({
            path: z.object({ id: z.string() }),
            body: z.object({ title: z.string(), author: z.string() }),
            handler: (req) => okAsync({
                body: { 
                    id: req.pathParams.id,
                    title: req.body.title,
                    author: req.body.author
                }
            })
        }),
        method: 'POST'
    })

    console.log(router)
}
