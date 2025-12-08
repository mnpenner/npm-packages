import {URLPattern} from 'urlpattern-polyfill'
import {NeverjectPromise, okAsync, errAsync, nj, err, Result, ok} from 'neverject'
import {isResult} from 'neverject/result'
import {ZodType, z} from 'zod'
import {HttpStatus} from './http-enums'
import * as ts from 'typescript'
import path from 'node:path'

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

type ExtractedRouteMeta = {
    name: string
    method: string
    pattern: string
    bodyType: string
    pathType: string
    queryType: string
    successType: string
}

function getProgramFromTsConfig(tsconfigPath: string): ts.Program {
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (configFile.error) {
        throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`)
    }
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath))
    return ts.createProgram(parsed.fileNames, parsed.options)
}

function getHandlerTypeArguments(type: ts.Type): ts.Type[] | undefined {
    const ref = type as ts.TypeReference
    if (ref.typeArguments && ref.typeArguments.length === 4) {
        return ref.typeArguments
    }
    const aliasArgs = (type as any).aliasTypeArguments as ts.Type[] | undefined
    if (aliasArgs && aliasArgs.length === 4) {
        return aliasArgs
    }
    if (type.isUnion()) {
        for (const t of type.types) {
            const found = getHandlerTypeArguments(t)
            if (found) return found
        }
    }
    const bases = type.getBaseTypes()
    if (bases) {
        for (const base of bases) {
            const found = getHandlerTypeArguments(base)
            if (found) return found
        }
    }
    return undefined
}

function typeText(type: ts.Type, checker: ts.TypeChecker, node?: ts.Node): string {
    return checker.typeToString(
        type,
        node,
        ts.TypeFormatFlags.NoTruncation
        | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope
        | ts.TypeFormatFlags.UseFullyQualifiedType
    )
}

function getProp(node: ts.ObjectLiteralExpression, propName: string): ts.Expression | undefined {
    for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && prop.name.getText() === propName) {
            return prop.initializer
        }
    }
    return undefined
}

function extractRoutesFromSourceFile(sourceFile: ts.SourceFile, checker: ts.TypeChecker, routerName: string): ExtractedRouteMeta[] {
    const routes: ExtractedRouteMeta[] = []

    const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
            if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'add') {
                if (ts.isIdentifier(node.expression.expression) && node.expression.expression.text === routerName) {
                    const [arg] = node.arguments
                    if (arg && ts.isObjectLiteralExpression(arg)) {
                        const methodNode = getProp(arg, 'method')
                        const patternNode = getProp(arg, 'pattern')
                        const nameNode = getProp(arg, 'name')
                        const handlerNode = getProp(arg, 'handler')

                        const method = methodNode && ts.isStringLiteralLike(methodNode) ? methodNode.text : 'GET'
                        const pattern = patternNode && ts.isStringLiteralLike(patternNode) ? patternNode.text : '/'

                        const handlerType = handlerNode ? checker.getTypeAtLocation(handlerNode) : undefined
                        const typeArgs = handlerType ? getHandlerTypeArguments(handlerType) : undefined
                        const [bodyType, pathType, queryType, successType] = typeArgs ?? []

                        const name = nameNode && ts.isStringLiteralLike(nameNode)
                            ? nameNode.text
                            : pattToName(method, new URLPattern({ pathname: pattern }))

                        routes.push({
                            name,
                            method,
                            pattern,
                            bodyType: bodyType ? typeText(bodyType, checker, handlerNode) : 'unknown',
                            pathType: pathType ? typeText(pathType, checker, handlerNode) : 'unknown',
                            queryType: queryType ? typeText(queryType, checker, handlerNode) : 'unknown',
                            successType: successType ? typeText(successType, checker, handlerNode) : 'unknown',
                        })
                    }
                }
            }
        }
        ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return routes
}

function patternToUrlTemplate(pattern: string): string {
    const templated = pattern.replace(/:([a-zA-Z0-9_]+)/g, '${path.$1}')
    if (templated.includes('${')) {
        return '`' + templated + '`'
    }
    return `"${pattern}"`
}

function isUnknown(text: string): boolean {
    return text === 'unknown' || text === 'any'
}

function buildApiClientSource(routes: ExtractedRouteMeta[]): string {
    const lines: string[] = []
    lines.push(`class ApiClient {`)
    lines.push(`    private readonly fetcher: Fetcher`)
    lines.push(``)
    lines.push(`    constructor(apiEndpoint: string) {`)
    lines.push(`        this.fetcher = new Fetcher({`)
    lines.push(`            baseUrl: apiEndpoint,`)
    lines.push(`            mode: 'cors',`)
    lines.push(`            credentials: 'include',`)
    lines.push(`        })`)
    lines.push(`    }`)
    lines.push(``)

    for (const route of routes) {
        const params: string[] = []
        if (!isUnknown(route.pathType)) params.push(`path: ${route.pathType}`)
        if (!isUnknown(route.queryType)) params.push(`query: ${route.queryType}`)
        if (!isUnknown(route.bodyType)) params.push(`body: ${route.bodyType}`)

        const urlExpr = patternToUrlTemplate(route.pattern)
        const returnType = `NeverjectPromise<${route.successType}, RawError>`

        lines.push(`    ${route.name}(${params.join(', ')}): ${returnType} {`)
        lines.push(`        return this.fetcher.request<${route.successType}>({`)
        lines.push(`            url: ${urlExpr},`)
        lines.push(`            method: "${route.method}",`)
        if (!isUnknown(route.bodyType)) {
            lines.push(`            body: JSON.stringify(body),`)
        }
        if (!isUnknown(route.queryType)) {
            lines.push(`            query,`)
        }
        lines.push(`        }) as ${returnType}`)
        lines.push(`    }`)
        lines.push(``)
    }

    lines.push(`}`)
    return lines.join('\n')
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

    const tsconfigPath = path.resolve('tsconfig.json')
    const program = getProgramFromTsConfig(tsconfigPath)
    const sourceFile = program.getSourceFile(path.resolve('v2/extract-client.ts'))
    if (!sourceFile) {
        throw new Error('Unable to load source file for extraction')
    }

    const routes = extractRoutesFromSourceFile(sourceFile, program.getTypeChecker(), 'router')
    const client = buildApiClientSource(routes)
    console.log(client)
}
