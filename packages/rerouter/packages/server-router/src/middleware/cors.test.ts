#!/usr/bin/env -S bun test
import {describe, expect, it, mock} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router} from '../router'
import {cors} from './cors'

describe(cors.name, () => {
    it('adds wildcard allow-origin by default', async () => {
        const router = new Router()
        router.use(cors({origin: '*'}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/data',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/data', {
            headers: {origin: 'https://app.example.com'},
        }))

        expect(response.headers.get('access-control-allow-origin')).toBe('*')
    })

    it('supports an origin resolver function', async () => {
        const router = new Router()
        router.use(cors({
            origin: (origin) => origin?.endsWith('.example.com') ? origin : null,
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/data',
            handler: () => new Response('ok'),
        })

        const allowed = await router.fetch(new Request('https://api.example.com/data', {
            headers: {origin: 'https://app.example.com'},
        }))

        const denied = await router.fetch(new Request('https://api.example.com/data', {
            headers: {origin: 'https://evil.example'},
        }))

        expect(allowed.headers.get('access-control-allow-origin')).toBe('https://app.example.com')
        expect(denied.headers.has('access-control-allow-origin')).toBe(false)
    })

    it('echoes the origin when credentials are enabled', async () => {
        const router = new Router()
        router.use(cors({origin: '*', credentials: true}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/data',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/data', {
            headers: {origin: 'https://app.example.com'},
        }))

        expect(response.headers.get('access-control-allow-origin')).toBe('https://app.example.com')
        expect(response.headers.get('access-control-allow-credentials')).toBe('true')
        expect(response.headers.get('vary')).toContain('Origin')
    })

    it('exposes response headers when configured', async () => {
        const router = new Router()
        router.use(cors({origin: '*', exposeHeaders: ['x-trace', 'x-request-id']}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/data',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/data', {
            headers: {origin: 'https://app.example.com'},
        }))

        expect(response.headers.get('access-control-expose-headers')).toBe('x-trace, x-request-id')
    })

    it('accepts a static allowMethods list', async () => {
        const router = new Router()
        router.use(cors({origin: '*', allowMethods: ['GET', 'POST']}))
        router.add({
            method: HttpMethod.OPTIONS,
            pattern: '/widgets',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/widgets', {
            method: HttpMethod.OPTIONS,
            headers: {
                origin: 'https://app.example.com',
                'access-control-request-method': 'POST',
            },
        }))

        expect(response.headers.get('access-control-allow-methods')).toBe('GET, POST')
    })

    it('accepts a dynamic allowMethods resolver', async () => {
        const router = new Router()
        router.use(cors({
            origin: '*',
            allowMethods: (origin) => origin === 'https://app.example.com' ? ['GET'] : ['POST'],
        }))
        router.add({
            method: HttpMethod.OPTIONS,
            pattern: '/widgets',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/widgets', {
            method: HttpMethod.OPTIONS,
            headers: {
                origin: 'https://app.example.com',
                'access-control-request-method': 'POST',
            },
        }))

        expect(response.headers.get('access-control-allow-methods')).toBe('GET')
    })

    it('allows localhost origins when dev is enabled', async () => {
        const router = new Router()
        router.use(cors({origin: 'https://app.example.com', dev: true}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/data',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/data', {
            headers: {origin: 'http://localhost:3000'},
        }))

        expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
    })

    it('allows localhost origins when allowLocalhost is enabled', async () => {
        const router = new Router()
        router.use(cors({origin: 'https://app.example.com', allowLocalhost: true}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/data',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/data', {
            headers: {origin: 'http://127.0.0.1:3000'},
        }))

        expect(response.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:3000')
    })

    it('handles CORS preflight requests', async () => {
        const router = new Router()
        const handler = mock(() => new Response('ok'))
        router.use(cors({origin: '*', maxAge: 600}))
        router.add({
            method: HttpMethod.OPTIONS,
            pattern: '/widgets',
            handler,
        })

        const response = await router.fetch(new Request('https://api.example.com/widgets', {
            method: HttpMethod.OPTIONS,
            headers: {
                origin: 'https://app.example.com',
                'access-control-request-method': 'POST',
                'access-control-request-headers': 'x-test, content-type',
            },
        }))

        expect(response.status).toBe(HttpStatus.NO_CONTENT)
        expect(handler).not.toHaveBeenCalled()
        expect(response.headers.get('access-control-allow-origin')).toBe('*')
        expect(response.headers.get('access-control-allow-methods'))
            .toBe('GET, HEAD, PUT, POST, DELETE, PATCH')
        expect(response.headers.get('access-control-allow-headers'))
            .toBe('x-test, content-type')
        expect(response.headers.get('access-control-max-age')).toBe('600')
    })

    it('uses custom allowHeaders and preflightStatus', async () => {
        const router = new Router()
        router.use(cors({
            origin: '*',
            allowHeaders: ['x-custom', 'content-type'],
            preflightStatus: HttpStatus.OK,
        }))
        router.add({
            method: HttpMethod.OPTIONS,
            pattern: '/widgets',
            handler: () => new Response('ok'),
        })

        const response = await router.fetch(new Request('https://api.example.com/widgets', {
            method: HttpMethod.OPTIONS,
            headers: {
                origin: 'https://app.example.com',
                'access-control-request-method': 'POST',
            },
        }))

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.headers.get('access-control-allow-headers')).toBe('x-custom, content-type')
    })
})
