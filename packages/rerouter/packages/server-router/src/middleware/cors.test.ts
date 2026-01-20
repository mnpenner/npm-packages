#!/usr/bin/env -S bun test
import {describe, expect, it, mock} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router} from '../router'
import {cors} from './cors'

describe(cors.name, () => {
    it('adds wildcard allow-origin by default', async () => {
        const router = new Router()
        router.use(cors())
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

    it('echoes the origin when credentials are enabled', async () => {
        const router = new Router()
        router.use(cors({credentials: true}))
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

    it('handles CORS preflight requests', async () => {
        const router = new Router()
        const handler = mock(() => new Response('ok'))
        router.use(cors({maxAge: 600}))
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
})
