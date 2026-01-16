#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {Router} from './router'
import type {Handler, Middleware} from './types'

const makeRequest = (path: string, method = 'GET') =>
    new Request(`https://example.com${path}`, {method})

describe('Router', () => {
    it('works with Bun.serve', async () => {
        const router = new Router().add({method: 'GET', pattern: '/hello', handler: () => new Response('world')})

        const server = Bun.serve({
            port: 0,
            fetch: router.fetch.bind(router),
        })

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
        const handler: Handler<unknown, unknown, unknown, unknown> = async function* () {
            yield 201
            yield new Headers({'x-stream': 'true'})
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
