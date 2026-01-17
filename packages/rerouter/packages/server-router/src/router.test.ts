#!/usr/bin/env -S bun test
import {describe, expect, it, mock} from 'bun:test'
import {Router} from './router'
import type {Handler, Middleware} from './types'

function makeRequest(path: string, method = 'GET', headers?: HeadersInit): Request {
    const init: RequestInit = {method}
    if (headers) init.headers = headers
    return new Request(`https://example.com${path}`, init)
}

function makePortCandidates(): number[] {
    const ports = [0]
    for (let idx = 0; idx < 10; idx += 1) {
        ports.push(10_000 + Math.floor(Math.random() * 40_000))
    }
    return ports
}

function startServer(
    fetchHandler: (request: Request) => Response | Promise<Response>
): ReturnType<typeof Bun.serve> | null {
    const ports = makePortCandidates()
    let lastError: unknown
    for (const port of ports) {
        try {
            return Bun.serve({
                port,
                hostname: '127.0.0.1',
                fetch: fetchHandler,
            })
        } catch (err) {
            lastError = err
            if ((err as {code?: string} | null)?.code !== 'EADDRINUSE') {
                throw err
            }
        }
    }
    return null
}

describe('Router', () => {
    it('works with Bun.serve', async () => {
        const router = new Router().add({method: 'GET', pattern: '/hello', handler: () => new Response('world')})

        const server = startServer(router.fetch.bind(router))
        if (!server) return

        try {
            const response = await fetch(`http://localhost:${server.port}/hello`)
            expect(response.status).toBe(200)
            expect(await response.text()).toBe('world')
        } finally {
            server.stop(true).catch(console.error)
        }
    })

    it('returns 404 for missing routes', async () => {
        const router = new Router()
        const response = await router.fetch(makeRequest('/missing'))

        expect(response.status).toBe(404)
        expect(await response.text()).toBe('Not Found')
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
        router.add({method: 'GET', pattern: '/', handler})

        const getResponse = await router.fetch(makeRequest('/'))
        expect(getResponse.status).toBe(201)
        expect(getResponse.headers.get('x-stream')).toBe('true')
        expect(await getResponse.text()).toBe('hello')

        const headResponse = await router.fetch(makeRequest('/', 'HEAD'))
        expect(headResponse.status).toBe(201)
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
        router.add({method: 'GET', pattern: '/', handler})

        const responsePromise = router.fetch(makeRequest('/', 'HEAD'))
        const response = await Promise.race([
            responsePromise,
            new Promise<Response>((_, reject) =>
                setTimeout(() => reject(new Error('response did not resolve')), 50)
            ),
        ])

        expect(response.status).toBe(200)
        expect(response.headers.get('x-stream')).toBe('true')
        expect(await response.text()).toBe('')
        resume()
    })

    it('accepts metadata objects from streaming handlers', async () => {
        const router = new Router()
        router.add({
            method: 'GET',
            pattern: '/status',
            handler: async function* () {
                yield {status: 202}
                return new TextEncoder().encode('ok')
            },
        })
        router.add({
            method: 'GET',
            pattern: '/headers',
            handler: async function* () {
                yield {headers: {'x-meta': 'yes'}}
                return new TextEncoder().encode('ok')
            },
        })
        router.add({
            method: 'GET',
            pattern: '/both',
            handler: async function* () {
                yield {status: 201, headers: {'x-both': 'true'}}
                return new TextEncoder().encode('ok')
            },
        })

        const statusResponse = await router.fetch(makeRequest('/status'))
        expect(statusResponse.status).toBe(202)
        expect(await statusResponse.text()).toBe('ok')

        const headersResponse = await router.fetch(makeRequest('/headers'))
        expect(headersResponse.status).toBe(200)
        expect(headersResponse.headers.get('x-meta')).toBe('yes')
        expect(await headersResponse.text()).toBe('ok')

        const bothResponse = await router.fetch(makeRequest('/both'))
        expect(bothResponse.status).toBe(201)
        expect(bothResponse.headers.get('x-both')).toBe('true')
        expect(await bothResponse.text()).toBe('ok')
    })

    it('streams yielded body chunks and appends the returned body', async () => {
        const router = new Router()
        router.add({
            method: 'GET',
            pattern: '/stream',
            handler: async function* () {
                yield 'hello '
                yield new TextEncoder().encode('world')
                yield Buffer.from('!')
                return ' done'
            },
        })

        const response = await router.fetch(makeRequest('/stream'))
        expect(response.status).toBe(200)
        expect(await response.text()).toBe('hello world! done')
    })

    it('returns string or bytes as response bodies', async () => {
        const router = new Router()
        router.add({
            method: 'GET',
            pattern: '/text',
            handler: () => 'ok',
        })
        router.add({
            method: 'GET',
            pattern: '/bytes',
            handler: () => new Uint8Array([111, 107]),
        })

        const textResponse = await router.fetch(makeRequest('/text'))
        expect(textResponse.status).toBe(200)
        expect(await textResponse.text()).toBe('ok')

        const bytesResponse = await router.fetch(makeRequest('/bytes'))
        expect(bytesResponse.status).toBe(200)
        expect(await bytesResponse.text()).toBe('ok')
    })

    it('prefers explicit HEAD handlers and falls back to GET handlers', async () => {
        const router = new Router()
        let getCalls = 0
        let headCalls = 0
        router.add({
            method: 'GET',
            pattern: '/resource',
            handler: () => {
                getCalls += 1
                return new Response('get')
            },
        })
        router.add({
            method: 'HEAD',
            pattern: '/resource',
            handler: () => {
                headCalls += 1
                return new Response('head')
            },
        })
        router.add({
            method: 'GET',
            pattern: '/fallback',
            handler: () => {
                getCalls += 1
                return new Response('get')
            },
        })

        const headResponse = await router.fetch(makeRequest('/resource', 'HEAD'))
        expect(headResponse.status).toBe(200)
        expect(headCalls).toBe(1)
        expect(getCalls).toBe(0)

        const fallbackResponse = await router.fetch(makeRequest('/fallback', 'HEAD'))
        expect(fallbackResponse.status).toBe(200)
        expect(getCalls).toBe(1)
    })

    it('returns 405 when the route exists but the method is not allowed', async () => {
        const router = new Router()
        let postCalls = 0
        router.add({
            method: 'POST',
            pattern: '/mutate',
            handler: () => {
                postCalls += 1
                return new Response('ok')
            },
        })

        const headResponse = await router.fetch(makeRequest('/mutate', 'HEAD'))
        expect(headResponse.status).toBe(405)
        expect(postCalls).toBe(0)

        const getResponse = await router.fetch(makeRequest('/mutate', 'GET'))
        expect(getResponse.status).toBe(405)
        expect(postCalls).toBe(0)

        const postResponse = await router.fetch(makeRequest('/mutate', 'POST'))
        expect(postResponse.status).toBe(200)
        expect(postCalls).toBe(1)
    })

    it('supports method arrays including HEAD', async () => {
        const router = new Router()
        let calls = 0
        router.add({
            method: ['POST', 'HEAD'],
            pattern: '/combo',
            handler: () => {
                calls += 1
                return new Response('ok')
            },
        })

        const headResponse = await router.fetch(makeRequest('/combo', 'HEAD'))
        expect(headResponse.status).toBe(200)
        expect(calls).toBe(1)

        const postResponse = await router.fetch(makeRequest('/combo', 'POST'))
        expect(postResponse.status).toBe(200)
        expect(calls).toBe(2)

        const getResponse = await router.fetch(makeRequest('/combo', 'GET'))
        expect(getResponse.status).toBe(405)
        expect(calls).toBe(2)
    })

    it('returns 406 when Content-Type does not satisfy the route accept', async () => {
        const router = new Router()
        router.add({
            method: 'POST',
            pattern: '/json',
            accept: 'application/json; charset=UTF-8',
            handler: () => new Response('ok'),
        })

        const missingHeader = await router.fetch(makeRequest('/json', 'POST'))
        expect(missingHeader.status).toBe(406)

        const wrongType = await router.fetch(makeRequest('/json', 'POST', {'content-type': 'text/plain'}))
        expect(wrongType.status).toBe(406)

        const wrongCharset = await router.fetch(
            makeRequest('/json', 'POST', {'content-type': 'application/json; charset=latin1'})
        )
        expect(wrongCharset.status).toBe(406)

        const noCharset = await router.fetch(makeRequest('/json', 'POST', {'content-type': 'application/json'}))
        expect(noCharset.status).toBe(200)
        expect(await noCharset.text()).toBe('ok')

        const normalizedCharset = await router.fetch(
            makeRequest('/json', 'POST', {'content-type': 'application/json; charset=utf8'})
        )
        expect(normalizedCharset.status).toBe(200)
        expect(await normalizedCharset.text()).toBe('ok')
    })

    it('allows Content-Type when route does not specify accept', async function () {
        const router = new Router()
        router.add({
            method: 'POST',
            pattern: '/plain',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(makeRequest('/plain', 'POST', {'content-type': 'text/plain'}))
        expect(response.status).toBe(200)
        expect(await response.text()).toBe('ok')
    })
})

describe.skip('Router middleware', () => {
    it('stacks middleware across mounted routers', async () => {
        const events: string[] = []
        const log = (label: string): Middleware => async (_ctx, next) => {
            events.push(`${label}:before`)
            const result = await next()
            events.push(`${label}:after`)
            return result
        }
        const handler: Handler<unknown, unknown, unknown, unknown> = async () => {
            events.push('handler')
            return new Response('ok')
        }

        const api = new Router([log('api')])
        api.add({method: 'GET', pattern: '/items', handler})

        const router = new Router([log('root')])
        router.mount('/api', api)

        const response = await router.fetch(makeRequest('/api/items'))
        expect(response.status).toBe(200)
        expect(events).toEqual([
            'root:before',
            'api:before',
            'handler',
            'api:after',
            'root:after',
        ])
    })

    it('scopes middleware when using use(middleware, router)', async () => {
        const events: string[] = []
        const log = (label: string): Middleware => async (_ctx, next) => {
            events.push(`${label}:before`)
            const result = await next()
            events.push(`${label}:after`)
            return result
        }
        const scopedHandler: Handler<unknown, unknown, unknown, unknown> = async () => {
            events.push('scoped')
            return new Response('scoped')
        }
        const rootHandler: Handler<unknown, unknown, unknown, unknown> = async () => {
            events.push('root')
            return new Response('root')
        }

        const scopedRouter = new Router().add({method: 'GET', pattern: '/scoped', handler: scopedHandler})
        const router = new Router()
        router.add({method: 'GET', pattern: '/root', handler: rootHandler})
        router.use(log('scoped'), scopedRouter)

        await router.fetch(makeRequest('/root'))
        expect(events).toEqual(['root'])

        events.length = 0
        await router.fetch(makeRequest('/scoped'))
        expect(events).toEqual(['scoped:before', 'scoped', 'scoped:after'])
    })
})
