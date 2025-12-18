#!/usr/bin/env -S bun test
import {describe, it, expect} from "bun:test"
// Use updated Handlers type
// Use RequestParams from router
import {Router} from "./router"
import type {RequestHandler, RequestMiddleware, RequestContext, MatchedPath} from './run-handler-types'
import {ANY_PATH} from "./constants"
import {timeout} from '../middleware/timeout'
import {sleep} from '#shared/misc'
import {addAccept} from '../middleware/add-accept'
import {convertStdResponse} from '../middleware/convert-std-response'
import {ErrorCode} from '../std-response'
import {HttpStatus} from '#shared/enums'


// --- Test Context & User Types ---
type TestUser = { id: number; name: string };
type TestContext = { user?: TestUser; traceId?: string };


function simpleHandler(response: BodyInit | null, status?: number): RequestHandler {
    return () => new Response(response, {status})
}


describe("Router", () => {

    // --- Reusable Test Handlers ---
    const traceHandlers: RequestMiddleware<TestContext> = async (ctx, next) => {
        ctx.traceId = Math.random().toString(36).substring(2)
        await next()
    }
    const authHandlers: RequestMiddleware<TestContext> = async (ctx, next) => {
        ctx.user = {id: 1, name: 'Admin'}
        await next()
    }
    const rateLimitHandlers: RequestMiddleware<TestContext> = async (ctx, next) => {
        await next()
    }
    const corsHandlers: RequestMiddleware = (ctx, next) => next()

    // --- Reusable Test Handlers ---
    const handlerA = simpleHandler("Handler A")
    const handlerB = simpleHandler("Handler B")
    const handlerC = simpleHandler("Handler C")
    const handlerD = simpleHandler("Handler D") // CORS OPTIONS handler
    const handlerE = simpleHandler("Handler E")
    const optionsHandler = simpleHandler(null, 204)

    // --- Basic Tests ---
    it("handle basic GET request", () => {
        const router = new Router().get('/foo', handlerA)
        expect(router.match('GET', '/foo')?.handlers).toEqual([handlerA])
    })

    it("returns router-level handlers", () => {
        const router = new Router<TestContext>([traceHandlers]).get('/foo', handlerA)
        expect(router.match('GET', '/foo')?.handlers).toEqual([traceHandlers, handlerA])
    })

    // --- Handlers Stacking and Scoping ---
    it('stacks handlers correctly via use()', () => {
        const router = new Router<TestContext>([traceHandlers])
            .get('/login', handlerA)
            .use([authHandlers], r => r
                .post('/upload', handlerB)
                .use([rateLimitHandlers], r => r
                    .patch('/limit', handlerC)
                )
            )
            .post('/logout', handlerD) // Assuming D was intended logout handler

        expect(router.match('GET', '/login')?.handlers)
            .toEqual([traceHandlers, handlerA])
        expect(router.match('POST', '/upload')?.handlers)
            .toEqual([traceHandlers, authHandlers, handlerB])
        expect(router.match('PATCH', '/limit')?.handlers)
            .toEqual([traceHandlers, authHandlers, rateLimitHandlers, handlerC])
        expect(router.match('POST', '/logout')?.handlers)
            .toEqual([traceHandlers, handlerD])
    })

    it("removes falsy handlers values", () => {
        const isDev = false
        const devLogger: RequestMiddleware | false = isDev && traceHandlers
        const prodRateLimit: RequestMiddleware | false = !isDev && rateLimitHandlers
        const router = new Router([devLogger])
            .get('/foo', [prodRateLimit, handlerA])
        expect(router.match('GET', '/foo')?.handlers).toEqual([rateLimitHandlers, handlerA])
    })

    // --- Mounting Tests (Should pass now) ---
    it('mounts routes under a prefix', () => {
        const getMeHandler: RequestMiddleware<TestContext> = (ctx: RequestContext<TestContext>) => Response.json(ctx.user)
        const postItemsHandler: RequestMiddleware = (rp, next) => new Response('created', {status: 201})

        const router = new Router<TestContext>([traceHandlers])
            .get('/login', handlerA)
            .mount('/api', (r: Router<TestContext>) => r
                .use([authHandlers], r => r.get('/me', getMeHandler)) // Sub-path is '/me'
                .post('/items', postItemsHandler) // Sub-path is '/items'
            )

        expect(router.match('GET', '/login')?.handlers).toEqual([traceHandlers, handlerA])
        // Expecting merged path '/api/me'
        expect(router.match('GET', '/api/me')?.handlers).toEqual([traceHandlers, authHandlers, getMeHandler])
        // Expecting merged path '/api/items'
        expect(router.match('POST', '/api/items')?.handlers).toEqual([traceHandlers, postItemsHandler])
        expect(router.match('GET', '/api/login')).toBeNull()
        expect(router.match('GET', '/me')).toBeNull()
    })

    it('mounts pre-configured router using mount', () => {
        const getMeHandler: RequestMiddleware<TestContext> = (ctx: RequestContext<TestContext>) => Response.json(ctx.user)
        const postItemsHandler: RequestMiddleware = (rp, next) => new Response('created', {status: 201})

        const apiRouter = new Router<TestContext>()
            .use([authHandlers], r => r.get('/me', getMeHandler)) // Sub-path '/me'
            .post('/items', postItemsHandler) // Sub-path '/items'

        const mainRouter = new Router<TestContext>([traceHandlers])
            .get('/login', handlerA)
            .mount('/api', apiRouter) // Mount with prefix '/api'

        expect(mainRouter.match('GET', '/login')?.handlers).toEqual([traceHandlers, handlerA])
        // Expecting merged path '/api/me'
        expect(mainRouter.match('GET', '/api/me')?.handlers).toEqual([traceHandlers, authHandlers, getMeHandler])
        // Expecting merged path '/api/items'
        expect(mainRouter.match('POST', '/api/items')?.handlers).toEqual([traceHandlers, postItemsHandler])
    })

    // --- Tappable Test ---
    it('is tappable for inspection or modification', () => {
        let optionsRouteAdded = false
        const router = new Router().get('/data', handlerA).tap(r => {
            const dataMethods = r.getPaths().get('/data')
            if(dataMethods && !dataMethods.has('OPTIONS')) {
                r.options('/data', optionsHandler)
                optionsRouteAdded = true
            }
        })
        expect(optionsRouteAdded).toBe(true)
        expect(router.match('OPTIONS', '/data')?.handlers).toEqual([optionsHandler])
    })


    // --- Wildcard Matching Tests ---
    it('matches ANY method (*) routes', () => {
        const router = new Router()
            .get('/specific', handlerA)
            .any('/specific', handlerB)
            .any('/fallback', handlerC)

        expect(router.match('GET', '/specific')?.handlers).toEqual([handlerA])
        expect(router.match('POST', '/specific')?.handlers).toEqual([handlerB])
        expect(router.match('GET', '/fallback')?.handlers).toEqual([handlerC])
    })

    it('matches wildcard path (*)', () => {
        const router = new Router()
            .get('/users/me', handlerA)
            .get(ANY_PATH, handlerB)
            .post(ANY_PATH, handlerC)
            .any(ANY_PATH, handlerD)

        expect(router.match('GET', '/users/me')?.handlers).toEqual([handlerA])
        expect(router.match('GET', '/other')?.handlers).toEqual([handlerB])
        expect(router.match('POST', '/upload')?.handlers).toEqual([handlerC])
        expect(router.match('DELETE', '/resource')?.handlers).toEqual([handlerD])
    })

    it('handles combined ANY method and wildcard path priorities', () => {
        const router = new Router()
            .get('/exact', handlerA) // 1
            .any('/exact', handlerB) // 2
            .get(ANY_PATH, handlerC) // 3
            .any(ANY_PATH, handlerD) // 4

        expect(router.match('GET', '/exact')?.handlers).toEqual([handlerA])
        expect(router.match('POST', '/exact')?.handlers).toEqual([handlerB])
        expect(router.match('GET', '/other')?.handlers).toEqual([handlerC])
        expect(router.match('PATCH', '/other')?.handlers).toEqual([handlerD])
    })

    // --- CORS Test ---
    it('supports CORS handlers using mount', () => {
        const corsOptionsHandler = handlerD

        const corsRouter = new Router()
            .use([corsHandlers], r => r.get('/cors-enabled', handlerC))
            .tap(subRouter => {
                for(const [path, methods] of subRouter.getPaths().entries()) {
                    if(!methods.has('OPTIONS')) {
                        subRouter.options(path, corsOptionsHandler)
                    }
                }
            })

        const mainRouter = new Router<TestContext>()
            .options('/special-options', handlerA)
            .get('/not-cors1', handlerB)
            .mount(corsRouter) // Mount without prefix
            .get('/not-cors2', handlerE)

        // console.log(mainRouter.getPaths())
        expect(mainRouter.match('OPTIONS', '/special-options')?.handlers).toEqual([handlerA])
        expect(mainRouter.match('GET', '/not-cors1')?.handlers).toEqual([handlerB])
        // console.log(mainRouter)
        expect(mainRouter.match('GET', '/not-cors2')?.handlers).toEqual([handlerE])
        // Handlers: cors base + route handler
        expect(mainRouter.match('GET', '/cors-enabled')?.handlers).toEqual([corsHandlers, handlerC])
        // Handlers: cors base + options handler
        expect(mainRouter.match('OPTIONS', '/cors-enabled')?.handlers).toEqual([corsOptionsHandler])
        expect(mainRouter.match('OPTIONS', '/not-cors1')).toBeNull()
        expect(mainRouter.match('OPTIONS', '/not-cors2')).toBeNull()
    })

    // --- Dispatch Test ---
    it('dispatch method finds route and invokes handlers (passing router in params)', async () => {
        const finalDataHandler: RequestMiddleware<TestContext> = (ctx) => {
            return Response.json({trace: ctx.traceId, user: ctx.user, params: ctx.pathParams})
        }
        const simpleOkHandler = simpleHandler('simple ok')

        const router = new Router<TestContext>()
            .use(traceHandlers, r => r
                .get('/data/exact', [authHandlers, finalDataHandler])
                .get('/simple', simpleOkHandler)
            )

        const reqSimple = new Request('http://localhost/simple')
        const responseSimple = await router.dispatch(reqSimple)
        expect(responseSimple.status).toBe(200)
        expect(await responseSimple.text()).toBe('simple ok')

        const reqData = new Request('http://localhost/data/exact')
        const responseData = await router.dispatch(reqData)
        expect(responseData.status).toBe(200)
        const body = await responseData.json()
        expect(body.trace).toBeString()
        expect(body.user).toEqual({id: 1, name: 'Admin'})
        expect(body.params).toEqual({})
    })

    it("doesn't add routes without handlers", () => {
        const router = new Router()
        router.get('/foo', [false])
        // expect(router.getPaths().get('/foo')).toBeUndefined()
        expect(router.match('GET', '/foo')).toBeNull()
    })

    it('default not found', async () => {
        const r = new Router()
        const res = await r.dispatch(new Request('http://localhost/not-found'))
        expect(res.status).toBe(404)
    })

    it('custom not found handler', async () => {
        const r = new Router()
            .notFound([
                ctx => {
                    ctx.supportsMiddleware = true
                },
                ctx => {
                    expect(ctx.supportsMiddleware).toBeTrue()
                    return new Response('Custom 404', {status: 404})
                }
            ])

        const res = await r.dispatch(new Request('http://localhost/not-found'))
        expect(await res.text()).toBe('Custom 404')
    })

    it('default error handler', async () => {
        const r = new Router()
            .get('/error', () => {
                throw new Error('Error')
            })
        const res = await r.dispatch(new Request('http://localhost/error'))
        expect(res.status).toBe(500)
    })

    it('custom error handler', async () => {
        const r = new Router()
            .get('/error', () => {
                throw new Error('Unique Error')
            })
            .error(ctx => {
                return new Response(`Custom: ${ctx.error.message}`, {status: 501})
            })
        const res = await r.dispatch(new Request('http://localhost/error'))
        expect(res.status).toBe(501)
        expect(await res.text()).toBe("Custom: Unique Error")
    })

    it('converts into error', async () => {
        const r = new Router()
            .get('/error', () => {
                throw "a string"
            })
            .error(ctx => {
                expect(ctx.error).toBeInstanceOf(Error)
                return new Response(`Custom: ${ctx.error.message}`, {status: 501})
            })
        const res = await r.dispatch(new Request('http://localhost/error'))
        expect(res.status).toBe(501)
        expect(await res.text()).toBe("Custom: a string")
    })

    it('error handler middleware', async() => {
        const r = new Router([(ctx,next) => next().catch((err:any) => {
            return new Response(`Custom: ${err}`, {status: 502})
        })])
            .get('/error', () => {
                throw "a string"
            })
        const res = await r.dispatch(new Request('http://localhost/error'))
        expect(res.status).toBe(502)
        expect(await res.text()).toBe("Custom: a string")

    })

    it('supports timeout middleware', async () => {
        const ctx = {}
        const r = new Router([addAccept, convertStdResponse, timeout(1)])
            .get('/slow', () => {
                return sleep(30_000).then(() => new Response('slow'))
            })

        const res = await r.dispatch(new Request('http://localhost/slow'), ctx)
        expect(res.status).toBe(HttpStatus.GATEWAY_TIMEOUT)
        expect(await res.json()).toEqual(expect.objectContaining({
            ok: false,
            code: ErrorCode.TIMEOUT,
            userMessage: "Response timed out.",
        }))
        expect(ctx).toEqual(expect.objectContaining({
            aborted: true,
        }))
    })

    describe('getPaths', () => {
        it('merges paths', () => {
            const router = new Router()
                .mount('/a', new Router()
                    .mount('/b', new Router()
                        .get('/c', () => new Response('c'))))
            expect(router.getPaths().get('/a/b/c')).toEqual(new Set(['GET']))
        })

        it('appends regex', () => {
            const router = new Router()
                .mount('/a', new Router()
                    .mount('/b', new Router()
                        .on(['GET','POST'],'/c', () => new Response('c'))
                        .patch('/c', () => new Response('c-patch'))
                        .post(/^\/d/, () => new Response('d'))
                    ))
            expect(router.getPaths()).toEqual(new Map<MatchedPath, Set<string>>([
                ['/a/b/c', new Set(['GET','POST','PATCH'])],
                [['/a/b', /^\/d/], new Set(['POST'])],
            ]))
        })
    })
})
