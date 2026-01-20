#!/usr/bin/env -S bun test
import {describe, expect, it, mock} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router} from './router'
import type {ContextMiddleware, Handler} from './types'
import {expectType} from './testing/type-assert'
import {requestIdCtx} from './middleware/request-id-ctx'

function makeRequest(path: string, method: HttpMethod = HttpMethod.GET, headers?: HeadersInit): Request {
    const init: RequestInit = {method}
    if (headers) init.headers = headers
    return new Request(`https://example.com${path}`, init)
}

describe('Router', () => {
    it.skip('works with Bun.serve', async () => {  // failing when ran by Codex for some reason
        const router = new Router().add({method: HttpMethod.GET, pattern: '/hello', handler: () => new Response('world')})

        const server = Bun.serve({
            port: 0,
            fetch: router.fetch.bind(router),
        })

        try {
            const response = await fetch(`http://localhost:${server.port}/hello`)
            expect(response.status).toBe(HttpStatus.OK)
            expect(await response.text()).toBe('world')
        } finally {
            server.stop(true).catch(console.error)
        }
    })

    it('returns 404 for missing routes', async () => {
        const router = new Router()
        const response = await router.fetch(makeRequest('/missing'))

        expect(response.status).toBe(HttpStatus.NOT_FOUND)
        expect(await response.text()).toBe('Not Found')
    })

    it('provides the parsed URL to handlers', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/search',
            handler: ({url}) => new Response(`${url.pathname}?q=${url.searchParams.get('q')}`),
        })

        const response = await router.fetch(makeRequest('/search?q=bun'))

        expect(await response.text()).toBe('/search?q=bun')
    })

    it('provides pathParams to handlers', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/users/:id',
            handler: ({pathParams}) => new Response(pathParams.id),
        })

        const response = await router.fetch(makeRequest('/users/42'))

        expect(await response.text()).toBe('42')
    })

    it('handles HEAD requests for streaming handlers', async () => {
        const beforeHeader = mock()
        const afterHeader = mock()
        const handler: Handler<unknown, unknown, unknown, unknown> = async function* () {
            yield 201
            beforeHeader()
            yield new Headers({'x-stream': 'true'})
            afterHeader()
            return new TextEncoder().encode('hello')
        }
        const router = new Router()
        router.add({method: HttpMethod.GET, pattern: '/', handler})

        const getResponse = await router.fetch(makeRequest('/'))
        expect(getResponse.status).toBe(HttpStatus.CREATED)
        expect(getResponse.headers.get('x-stream')).toBe('true')
        expect(await getResponse.text()).toBe('hello')

        const headResponse = await router.fetch(makeRequest('/', HttpMethod.HEAD))
        expect(headResponse.status).toBe(HttpStatus.CREATED)
        expect(headResponse.headers.get('x-stream')).toBe('true')
        expect(await headResponse.text()).toBe('')

        expect(beforeHeader).toHaveBeenCalledTimes(2)
        expect(afterHeader).toHaveBeenCalledTimes(1)
    })

    it('defaults to 200 when headers are yielded before status', async () => {
        const {resolve: resume, promise: deferred} = Promise.withResolvers()
        const handler: Handler<unknown, unknown, unknown, unknown> = async function* () {
            yield new Headers({'x-stream': 'true'})
            yield 499  // ignored
            await deferred
            return new TextEncoder().encode('hello')
        }
        const router = new Router()
        router.add({method: HttpMethod.GET, pattern: '/', handler})

        const responsePromise = router.fetch(makeRequest('/', HttpMethod.HEAD))
        const response = await Promise.race([
            responsePromise,
            new Promise<Response>((_, reject) =>
                setTimeout(() => reject(new Error('response did not resolve')), 50)
            ),
        ])

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.headers.get('x-stream')).toBe('true')
        expect(await response.text()).toBe('')
        resume()
    })

    it('accepts metadata objects from streaming handlers', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/status',
            handler: async function* () {
                yield {status: 202}
                return new TextEncoder().encode('ok')
            },
        })
        router.add({
            method: HttpMethod.GET,
            pattern: '/headers',
            handler: async function* () {
                yield {headers: {'x-meta': 'yes'}}
                return new TextEncoder().encode('ok')
            },
        })
        router.add({
            method: HttpMethod.GET,
            pattern: '/both',
            handler: async function* () {
                yield {status: 201, headers: {'x-both': 'true'}}
                return new TextEncoder().encode('ok')
            },
        })

        const statusResponse = await router.fetch(makeRequest('/status'))
        expect(statusResponse.status).toBe(HttpStatus.ACCEPTED)
        expect(await statusResponse.text()).toBe('ok')

        const headersResponse = await router.fetch(makeRequest('/headers'))
        expect(headersResponse.status).toBe(HttpStatus.OK)
        expect(headersResponse.headers.get('x-meta')).toBe('yes')
        expect(await headersResponse.text()).toBe('ok')

        const bothResponse = await router.fetch(makeRequest('/both'))
        expect(bothResponse.status).toBe(HttpStatus.CREATED)
        expect(bothResponse.headers.get('x-both')).toBe('true')
        expect(await bothResponse.text()).toBe('ok')
    })

    it('streams yielded body chunks and appends the returned body', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/stream',
            handler: async function* () {
                yield 'hello '
                yield new TextEncoder().encode('world')
                yield Buffer.from('!')
                return ' done'
            },
        })

        const response = await router.fetch(makeRequest('/stream'))
        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.text()).toBe('hello world! done')
    })

    it('streams response bodies written after returning a Response', async () => {
        const {resolve: allowWrite, promise: writeAllowed} = Promise.withResolvers<void>()
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/late',
            handler: async () => {
                const stream = new ReadableStream<Uint8Array>({
                    async start(controller) {
                        await writeAllowed
                        controller.enqueue(new TextEncoder().encode('late body'))
                        controller.close()
                    },
                })
                return new Response(stream)
            },
        })

        const responsePromise = router.fetch(makeRequest('/late'))
        const response = await Promise.race([
            responsePromise,
            new Promise<Response>((_, reject) =>
                setTimeout(() => reject(new Error('response did not resolve')), 50)
            ),
        ])

        expect(response.status).toBe(HttpStatus.OK)
        allowWrite()
        expect(await response.text()).toBe('late body')
    })

    it('exposes request aborts so handlers can stop early', async () => {
        const {resolve: handlerStarted, promise: handlerStartedPromise} = Promise.withResolvers<void>()
        const {resolve: allowCheck, promise: allowCheckPromise} = Promise.withResolvers<void>()
        const controller = new AbortController()
        let sawAbort = false
        let finished = false
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/slow',
            handler: async ({req}) => {
                handlerStarted()
                await allowCheckPromise
                if (req.signal.aborted) {
                    sawAbort = true
                    return new Response('aborted', {status: HttpStatus.CLIENT_CLOSED_REQUEST})
                }
                finished = true
                return new Response('ok')
            },
        })

        const responsePromise = router.fetch(new Request('https://example.com/slow', {signal: controller.signal}))
        await handlerStartedPromise
        controller.abort()
        allowCheck()

        const response = await responsePromise
        expect(response.status).toBe(HttpStatus.CLIENT_CLOSED_REQUEST)
        expect(sawAbort).toBe(true)
        expect(finished).toBe(false)
    })

    it('returns string or bytes as response bodies', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/text',
            handler: () => 'ok',
        })
        router.add({
            method: HttpMethod.GET,
            pattern: '/bytes',
            handler: () => new Uint8Array([111, 107]),
        })

        const textResponse = await router.fetch(makeRequest('/text'))
        expect(textResponse.status).toBe(HttpStatus.OK)
        expect(await textResponse.text()).toBe('ok')

        const bytesResponse = await router.fetch(makeRequest('/bytes'))
        expect(bytesResponse.status).toBe(HttpStatus.OK)
        expect(await bytesResponse.text()).toBe('ok')
    })

    it('prefers explicit HEAD handlers and falls back to GET handlers', async () => {
        const router = new Router()
        let getCalls = 0
        let headCalls = 0
        router.add({
            method: HttpMethod.GET,
            pattern: '/resource',
            handler: () => {
                getCalls += 1
                return new Response('get')
            },
        })
        router.add({
            method: HttpMethod.HEAD,
            pattern: '/resource',
            handler: () => {
                headCalls += 1
                return new Response('head')
            },
        })
        router.add({
            method: HttpMethod.GET,
            pattern: '/fallback',
            handler: () => {
                getCalls += 1
                return new Response('get')
            },
        })

        const headResponse = await router.fetch(makeRequest('/resource', HttpMethod.HEAD))
        expect(headResponse.status).toBe(HttpStatus.OK)
        expect(headCalls).toBe(1)
        expect(getCalls).toBe(0)

        const fallbackResponse = await router.fetch(makeRequest('/fallback', HttpMethod.HEAD))
        expect(fallbackResponse.status).toBe(HttpStatus.OK)
        expect(getCalls).toBe(1)
    })

    it('returns 405 when the route exists but the method is not allowed', async () => {
        const router = new Router()
        let postCalls = 0
        router.add({
            method: HttpMethod.POST,
            pattern: '/mutate',
            handler: () => {
                postCalls += 1
                return new Response('ok')
            },
        })

        const headResponse = await router.fetch(makeRequest('/mutate', HttpMethod.HEAD))
        expect(headResponse.status).toBe(HttpStatus.METHOD_NOT_ALLOWED)
        expect(postCalls).toBe(0)

        const getResponse = await router.fetch(makeRequest('/mutate', HttpMethod.GET))
        expect(getResponse.status).toBe(HttpStatus.METHOD_NOT_ALLOWED)
        expect(postCalls).toBe(0)

        const postResponse = await router.fetch(makeRequest('/mutate', HttpMethod.POST))
        expect(postResponse.status).toBe(HttpStatus.OK)
        expect(postCalls).toBe(1)
    })

    it('supports method arrays including HEAD', async () => {
        const router = new Router()
        let calls = 0
        router.add({
            method: [HttpMethod.POST, HttpMethod.HEAD],
            pattern: '/combo',
            handler: () => {
                calls += 1
                return new Response('ok')
            },
        })

        const headResponse = await router.fetch(makeRequest('/combo', HttpMethod.HEAD))
        expect(headResponse.status).toBe(HttpStatus.OK)
        expect(calls).toBe(1)

        const postResponse = await router.fetch(makeRequest('/combo', HttpMethod.POST))
        expect(postResponse.status).toBe(HttpStatus.OK)
        expect(calls).toBe(2)

        const getResponse = await router.fetch(makeRequest('/combo', HttpMethod.GET))
        expect(getResponse.status).toBe(HttpStatus.METHOD_NOT_ALLOWED)
        expect(calls).toBe(2)
    })

    it('automatically handles OPTIONS and reports allowed methods', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/cors',
            handler: function () {
                return new Response('get')
            },
        })
        router.add({
            method: HttpMethod.POST,
            pattern: '/cors',
            handler: function () {
                return new Response('post')
            },
        })

        const response = await router.fetch(makeRequest('/cors', HttpMethod.OPTIONS))
        expect(response.status).toBe(HttpStatus.NO_CONTENT)
        expect(response.headers.get('access-control-allow-methods')).toBe('GET, HEAD, POST, OPTIONS')
        expect(response.headers.has('access-control-allow-origin')).toBe(false)
    })

    it('returns 406 when Content-Type does not satisfy the route accept', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.POST,
            pattern: '/json',
            accept: ['application/json; charset=UTF-8', {type: 'text/plain'}],
            handler: () => new Response('ok'),
        })

        const missingHeader = await router.fetch(makeRequest('/json', HttpMethod.POST))
        expect(missingHeader.status).toBe(HttpStatus.NOT_ACCEPTABLE)

        const wrongType = await router.fetch(makeRequest('/json', HttpMethod.POST, {'content-type': 'text/html'}))
        expect(wrongType.status).toBe(HttpStatus.NOT_ACCEPTABLE)

        const wrongCharset = await router.fetch(
            makeRequest('/json', HttpMethod.POST, {'content-type': 'application/json; charset=latin1'})
        )
        expect(wrongCharset.status).toBe(HttpStatus.NOT_ACCEPTABLE)

        const noCharset = await router.fetch(makeRequest('/json', HttpMethod.POST, {'content-type': 'application/json'}))
        expect(noCharset.status).toBe(HttpStatus.OK)
        expect(await noCharset.text()).toBe('ok')

        const normalizedCharset = await router.fetch(
            makeRequest('/json', HttpMethod.POST, {'content-type': 'application/json; charset=utf8'})
        )
        expect(normalizedCharset.status).toBe(HttpStatus.OK)
        expect(await normalizedCharset.text()).toBe('ok')
    })

    it('allows Content-Type when route does not specify accept', async function () {
        const router = new Router()
        router.add({
            method: HttpMethod.POST,
            pattern: '/plain',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(makeRequest('/plain', HttpMethod.POST, {'content-type': 'text/plain'}))
        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.text()).toBe('ok')
    })
})

describe('Router.get', () => {
    it('registers GET routes', async () => {
        const router = new Router()
        router.get('/get', () => new Response('ok'))

        const [route] = router.getRoutes()
        expect(route?.method).toBe(HttpMethod.GET)

        const response = await router.fetch(makeRequest('/get', HttpMethod.GET))
        expect(response.status).toBe(HttpStatus.OK)
    })
})

describe('Router.head', () => {
    it('registers HEAD routes', async () => {
        const router = new Router()
        router.head('/head', () => new Response('ok'))

        const [route] = router.getRoutes()
        expect(route?.method).toBe(HttpMethod.HEAD)

        const response = await router.fetch(makeRequest('/head', HttpMethod.HEAD))
        expect(response.status).toBe(HttpStatus.OK)
    })
})

describe('Router.post', () => {
    it('registers POST routes', async () => {
        const router = new Router()
        router.post('/post', () => new Response('ok'))

        const [route] = router.getRoutes()
        expect(route?.method).toBe(HttpMethod.POST)

        const response = await router.fetch(makeRequest('/post', HttpMethod.POST))
        expect(response.status).toBe(HttpStatus.OK)
    })
})

describe('Router.put', () => {
    it('registers PUT routes', async () => {
        const router = new Router()
        router.put('/put', () => new Response('ok'))

        const [route] = router.getRoutes()
        expect(route?.method).toBe(HttpMethod.PUT)

        const response = await router.fetch(makeRequest('/put', HttpMethod.PUT))
        expect(response.status).toBe(HttpStatus.OK)
    })
})

describe('Router.delete', () => {
    it('registers DELETE routes', async () => {
        const router = new Router()
        router.delete('/delete', () => new Response('ok'))

        const [route] = router.getRoutes()
        expect(route?.method).toBe(HttpMethod.DELETE)

        const response = await router.fetch(makeRequest('/delete', HttpMethod.DELETE))
        expect(response.status).toBe(HttpStatus.OK)
    })
})

describe('Router.patch', () => {
    it('registers PATCH routes', async () => {
        const router = new Router()
        router.patch('/patch', () => new Response('ok'))

        const [route] = router.getRoutes()
        expect(route?.method).toBe(HttpMethod.PATCH)

        const response = await router.fetch(makeRequest('/patch', HttpMethod.PATCH))
        expect(response.status).toBe(HttpStatus.OK)
    })
})

describe('Router.notFound', () => {
    it('uses the configured notFound handler', async () => {
        const router = new Router().notFound(() => new Response('missing', {status: HttpStatus.NOT_FOUND}))

        const response = await router.fetch(makeRequest('/missing'))

        expect(response.status).toBe(HttpStatus.NOT_FOUND)
        expect(await response.text()).toBe('missing')
    })

    it('falls back to 500 when the notFound handler throws', async () => {
        const router = new Router().notFound(() => {
            throw new Error('boom')
        })

        const response = await router.fetch(makeRequest('/missing'))

        expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
        expect(await response.text()).toBe('Internal Server Error')
    })
})

describe('Router.methodNotAllowed', () => {
    it('uses the configured methodNotAllowed handler', async () => {
        const router = new Router()
            .methodNotAllowed(() => new Response('nope', {status: HttpStatus.METHOD_NOT_ALLOWED}))
            .add({
                method: HttpMethod.POST,
                pattern: '/mutate',
                handler: () => new Response('ok'),
            })

        const response = await router.fetch(makeRequest('/mutate', HttpMethod.GET))

        expect(response.status).toBe(HttpStatus.METHOD_NOT_ALLOWED)
        expect(await response.text()).toBe('nope')
    })
})

describe('Router.notAcceptable', () => {
    it('uses the configured notAcceptable handler', async () => {
        const router = new Router()
            .notAcceptable(() => new Response('unsupported', {status: HttpStatus.NOT_ACCEPTABLE}))
            .add({
                method: HttpMethod.POST,
                pattern: '/json',
                accept: ['application/json'],
                handler: () => new Response('ok'),
            })

        const response = await router.fetch(makeRequest('/json', HttpMethod.POST))

        expect(response.status).toBe(HttpStatus.NOT_ACCEPTABLE)
        expect(await response.text()).toBe('unsupported')
    })
})

describe('Router.internalError', () => {
    it('uses the configured internalError handler', async () => {
        const router = new Router()
            .internalError(() => new Response('broken', {status: HttpStatus.SERVICE_UNAVAILABLE}))
            .add({
                method: HttpMethod.GET,
                pattern: '/boom',
                handler: () => {
                    throw new Error('boom')
                },
            })

        const response = await router.fetch(makeRequest('/boom'))

        expect(response.status).toBe(HttpStatus.SERVICE_UNAVAILABLE)
        expect(await response.text()).toBe('broken')
    })

    it('falls back to 500 when the internalError handler throws', async () => {
        const router = new Router()
            .internalError(() => {
                throw new Error('handler boom')
            })
            .add({
                method: HttpMethod.GET,
                pattern: '/boom',
                handler: () => {
                    throw new Error('boom')
                },
            })

        const response = await router.fetch(makeRequest('/boom'))

        expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
        expect(await response.text()).toBe('Internal Server Error')
    })
})

describe('Router.fetch', () => {
    it('binds handler this to the matching router instance', async () => {
        const router = new Router()
        let boundRouter: Router | null = null
        router.add({
            method: HttpMethod.GET,
            pattern: '/ping',
            handler: function () {
                boundRouter = this
                return new Response('ok')
            },
        })

        const response = await router.fetch(new Request('https://example.com/ping'))

        expect(response.status).toBe(HttpStatus.OK)
        expect(boundRouter === router).toBe(true)
    })

    it('handles unbound fetch usage', async () => {
        const router = new Router()
        router.add({
            method: HttpMethod.GET,
            pattern: '/ping',
            handler: () => new Response('ok'),
        })

        const fetch = router.fetch
        const response = await fetch(new Request('https://example.com/ping'))

        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.text()).toBe('ok')
    })

    it('binds handlers to mounted routers', async () => {
        const parent = new Router()
        const child = new Router()
        let boundRouter: Router | null = null
        child.add({
            method: HttpMethod.GET,
            pattern: '/nested',
            handler: function () {
                boundRouter = this
                return new Response('ok')
            },
        })
        parent.mount('/api', child)

        const response = await parent.fetch(new Request('https://example.com/api/nested'))

        expect(response.status).toBe(HttpStatus.OK)
        expect(boundRouter === child).toBe(true)
    })
})

describe('Router.use', () => {
    it('infers middleware-added context for handlers', () => {
        const router = new Router().use(requestIdCtx())

        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ctx => {
                expectType<number>(ctx.requestId)
                return new Response('ok')
            },
        })
    })

    it('merges context across middleware lists', () => {
        const addUser: ContextMiddleware<{userId: string}> = ctx => {
            ctx.userId = 'user-1'
        }
        const addFlag: ContextMiddleware<{isAdmin: boolean}> = ctx => {
            ctx.isAdmin = true
        }

        const router = new Router().use([addUser, addFlag] as const)

        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ctx => {
                expectType<string>(ctx.userId)
                expectType<boolean>(ctx.isAdmin)
                return new Response('ok')
            },
        })
    })

    it('passes middleware context through to handlers', async () => {
        const addRequestIdLocal: ContextMiddleware<{requestId: number}> = async (ctx, next) => {
            ctx.requestId = 42
            return await next()
        }
        const router = new Router().use(addRequestIdLocal)
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ctx => new Response(String(ctx.requestId)),
        })

        const response = await router.fetch(makeRequest('/'))
        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.text()).toBe('42')
    })
})

describe('Router.group', () => {
    it('exposes grouped middleware context to handlers', () => {
        const addUser: ContextMiddleware<{userId: string}> = ctx => {
            ctx.userId = 'user-2'
        }

        const router = new Router().use(requestIdCtx())
        router.group([addUser] as const, group => {
            group.add({
                method: HttpMethod.GET,
                pattern: '/',
                handler: ctx => {
                    expectType<number>(ctx.requestId)
                    expectType<string>(ctx.userId)
                    return new Response('ok')
                },
            })
        })
    })

    it('applies parent and grouped middleware in order', async () => {
        const events: string[] = []
        const log = (label: string): ContextMiddleware => async (_ctx, next) => {
            events.push(`${label}:before`)
            const result = await next()
            events.push(`${label}:after`)
            return result
        }
        const router = new Router().use(log('root'))

        router.group([log('group')], group => {
            group.add({
                method: HttpMethod.GET,
                pattern: '/items',
                handler: () => {
                    events.push('handler')
                    return new Response('ok')
                },
            })
        })

        const response = await router.fetch(makeRequest('/items'))
        expect(response.status).toBe(HttpStatus.OK)
        expect(events).toEqual([
            'root:before',
            'group:before',
            'handler',
            'group:after',
            'root:after',
        ])
    })
})
