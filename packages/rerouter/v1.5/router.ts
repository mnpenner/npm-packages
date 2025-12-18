import {runHandler} from './run-handler'
import type {ConstructorArgs, NonFalsy} from '#shared/types/util-types'
import {forceArray, setAddMany} from '#shared/collection'
import type {DiscriminatedUnion} from '#shared/types/discriminated-union'
import type {
    AnyHandler,
    AnyMiddleware,
    AnyPathMatchers,
    AnyRequestMethods, AnyContext,
    ErrorHandler,
    HandlerChain,
    MatchedPath,
    MatchResult,
    Path,
    RequestContext,
    RequestMethod
} from './run-handler-types'
import {ANY_METHOD, ANY_PATH} from './constants'
import {assumeType} from '#shared/types/assert'

// type PathHandler<Ctx extends object = {}> = [path: AnyPathMatcher, handlers: Middleware<Ctx>[]];

function truthy<T>(value: T): value is NonFalsy<T> {
    return Boolean(value)
}

function normalizeMiddleware<Ctx extends object>(handlers: AnyMiddleware<Ctx>): HandlerChain<Ctx> {
    if(!handlers) return []
    if(!Array.isArray(handlers)) return [handlers]
    return handlers.filter(truthy) as HandlerChain<Ctx>
}

// function normalizeHandler<Ctx extends object>(handlers: AnyMiddleware): HandlerChain<Ctx>[] {
//     if(!handlers) return []
//     if(!Array.isArray(handlers)) return [handlers as any]
//     const filtered = handlers.filter(truthy)
//     if(!filtered.length) throw new Error('No handlers provided')
//     return filtered as any
// }

// const defaultNotFoundHandler: RequestMiddleware = () => new Response('Not Found', {status: 404})

const NOT_FOUND_RESPONSE = Object.freeze(new Response('Not Found', {status: 404}))
const SERVER_ERROR_RESPONSE = Object.freeze(new Response('Internal Server Error', {status: 500}))

// type RouteTuple = [method: RequestMethod, path: AnyPathMatchers, handler: HandlerChain]
// type SubRouterTuple = [prefix: string, router: Router]

// type RouteEntry = XOR<{
//     type: 'route',
//     method: RequestMethod,
//     path: PathMatcher,
//     handler: HandlerChain
// } | {
//     type: 'router',
//     prefix?: string,
//     router: Router
// }>

type RouteEntry<Ctx extends object = AnyContext> = DiscriminatedUnion<{kind:string},{
    kind: 'route',
    method: RequestMethod,
    path: Path,
    handlers: HandlerChain
} | {
    kind: 'router',
    prefix?: string,
    router: Router<Ctx>
}>

type AnyRouter =
    | Router<any>
    | ((r: Router<any>) => void|Router<any>)
    | (() => Router<any>)

function normalizeRouter<Ctx extends object = AnyContext>(factory: AnyRouter): Router<Ctx> {
    if(typeof factory === 'function') {
        const router = new Router()
        const result = factory(router) as any
        return result !== undefined ? result : router
    }
    return factory
}

export class Router<Ctx extends object = AnyContext> {
    private _routes: RouteEntry<Ctx>[] = []
    private _middleware: HandlerChain<Ctx> = []
    private _notFound: HandlerChain<Ctx>|null = null
    private _error: ErrorHandler|null = null

    constructor(middleware?: AnyMiddleware<Ctx>) {
        this._middleware = normalizeMiddleware<Ctx>(middleware)
    }

    private _addRoute(methods: AnyRequestMethods, paths: AnyPathMatchers, handler: AnyHandler): this {
        const mw = normalizeMiddleware<Ctx>(handler)
        if(mw.length) {
            for(const method of forceArray(methods)) {
                for(const path of forceArray(paths)) {
                    this._routes.push({kind: 'route', method, path, handlers: mw as any})
                }
            }
        }
        return this
    }

    use(handlers: AnyHandler, router: AnyRouter): this {
        const r = new Router<Ctx>(handlers)
        r.mount(normalizeRouter(router))
        this._routes.push({kind:'router',router:r})
        // const subRouter = normalizeRouter(router)
        // subRouter._baseHandlers.unshift(...normalizeHandlerChain<Ctx>(handlers))
        // this._routes.push({kind:'router',router:subRouter})
        return this
    }

    group(addRoutes: (subRouter: this) => void): this {
        addRoutes(this)
        return this
    }

    mount(router: AnyRouter): this;
    mount(prefix: string, router: AnyRouter): this;
    mount(prefixOrRouter: any, router?: any): this {
        if(typeof prefixOrRouter === 'string') {
            this._routes.push({kind:'router',prefix: prefixOrRouter,router:normalizeRouter(router)})
        } else {
            this._routes.push({kind:'router',router:normalizeRouter(prefixOrRouter)})
        }
        return this
    }

    tap(modify: (router: this) => void): this {
        modify(this)
        return this
    }

    getPaths() {
        const paths = new Map<MatchedPath, Set<RequestMethod>>()

        for(const entry of this._routes) {
            switch(entry.kind) {
                case 'route': {
                    const methods = paths.get(entry.path)
                    if(methods != null) {
                        methods.add(entry.method)
                    } else {
                        paths.set(entry.path, new Set<RequestMethod>([entry.method]))
                    }
                }break;
                case 'router': {
                    for(let [subPath,subMethods] of entry.router.getPaths().entries()) {
                        if(entry.prefix) {
                            if(typeof subPath === 'string') {
                                subPath = entry.prefix + subPath
                            } else if(Array.isArray(subPath)) {
                                subPath = [entry.prefix+subPath[0],subPath[1]]
                            } else {
                                subPath = [entry.prefix,subPath]
                            }
                        }
                        const methods = paths.get(subPath)
                        if(methods != null) {
                            setAddMany(methods, subMethods)
                        } else {
                            paths.set(subPath, subMethods)
                        }
                    }
                }break;
            }
        }

        return paths

    }

    // getRoute(path: PathMatcher): PathHandler<Ctx>[] {
    //     const foundRoutes: PathHandler<Ctx>[] = []
    //     this.routesOld.forEach((pathHandlers) => {
    //         pathHandlers.forEach((route) => {
    //             if(route[0] === path) {
    //                 foundRoutes.push(route)
    //             }
    //         })
    //     })
    //     return foundRoutes
    // }
    //
    // hasRoute(method: RequestMethod, path: PathMatcher): boolean {
    //     const routesForMethod = this.routesOld.get(method)
    //     if(!routesForMethod) return false
    //     return routesForMethod.some(([p]) => p === path)
    // }

    get(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('GET', path, handler)
    }

    head(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('HEAD', path, handler)
    }

    post(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('POST', path, handler)
    }

    put(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('PUT', path, handler)
    }

    delete(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('DELETE', path, handler)
    }

    connect(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('CONNECT', path, handler)
    }

    options(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('OPTIONS', path, handler)
    }

    trace(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('TRACE', path, handler)
    }

    patch(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute('PATCH', path, handler)
    }

    any(path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute(ANY_METHOD, path, handler)
    }

    // Laravel calls this "match"
    on(method: AnyRequestMethods, path: AnyPathMatchers, handler: AnyHandler): this {
        return this._addRoute(method, path, handler)
    }

    notFound(handler: AnyHandler): this {
        this._notFound = normalizeMiddleware(handler)
        return this
    }

    error(handler: ErrorHandler): this {
        this._error = handler
        return this
    }

    // compare with
    // https://github.com/honojs/hono/blob/02377efde52c5b182a1d1ade904b1a3caea7f827/src/router/linear-router/router.ts#L25

    /**
     * Searches for matching route entry.
     * @param method
     * @param pathname
     */
    match(method: string, pathname: string): MatchResult<Ctx> | null {
        //  TODO: Pattern
        //
        // [$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}][$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}]*
        for(const entry of this._routes) {
            switch(entry.kind) {
                case 'route': {
                    if((entry.method === method || entry.method === ANY_METHOD) && (entry.path === pathname || entry.path === ANY_PATH)) {
                        return {
                            handlers: [...this._middleware,...entry.handlers],
                            params: {},
                            matchedPath: entry.path,
                        }
                    }
                } break;
                case 'router': {
                    if(entry.prefix) {
                        if(pathname.startsWith(entry.prefix)) {
                            pathname = pathname.slice(entry.prefix.length)
                        } else continue
                    }
                    // console.log('entry',entry)
                    const result = entry.router.match(method, pathname)
                    if(result != null) {
                        return {
                            handlers: [...this._middleware,...result.handlers],
                            params: {},
                            matchedPath: (entry.prefix??'')+result.matchedPath,
                        }
                    }

                }break
            }
        }
        return null
    }

    // private createBaseRequestParams(req: Request): RequestContext<Ctx> {
    //     return {url: undefined, request: req, ctx: {} as Ctx, pathParams: {}, matchedPath: '', router: this}
    // }

    /**
     * Handles a request. Always returns a Response, never errors/rejects.
     * @param request
     * @param ctx Initial context. Will be updated.
     * @throws never
     */
    async dispatch(request: Request, ctx?: Ctx): Promise<Response> {
        const url = new URL(request.url)
        const matchResult = this.match(request.method, url.pathname)

        ctx ??= Object.create(null)

        assumeType<RequestContext<Ctx>>(ctx)

        Object.assign(ctx, {
                request,
                url,
                pathParams: matchResult?.params ?? {},
                router: this,
            })

        // const ctx: RequestContext = {
        //     request,
        //     url,
        //     pathParams: matchResult?.params ?? {},
        // }

        try {
            if(matchResult != null) {
                return await runHandler(ctx, matchResult.handlers)
            }
            if(this._notFound?.length) {
                return await runHandler(ctx, [...this._middleware,...this._notFound])
            }
            return NOT_FOUND_RESPONSE
        } catch(error) {
            if(this._error != null) {
                return Promise.try(this._error, {
                    ...ctx,
                    error: error instanceof Error ? error : new Error(String(error)),
                }).catch(() => SERVER_ERROR_RESPONSE)
            }
            // console.error("Error during handler invocation:", error)
            // const message = error instanceof Error ? error.message : 'Internal Server Error'
            return SERVER_ERROR_RESPONSE
        }
    }
}

export function router<Ctx extends object = AnyContext>(...args: ConstructorArgs<typeof Router<Ctx>>) {
    return new Router<Ctx>(...args)
}
