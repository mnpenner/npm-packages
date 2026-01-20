#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {Router} from '../router'
import {requestIdCtx} from './request-id-ctx'

function makeRequest(headers?: HeadersInit): Request {
    const init: RequestInit = {method: HttpMethod.GET}
    if (headers) init.headers = headers
    return new Request('https://example.com/', init)
}

describe(requestIdCtx.name, () => {
    it('uses the request id header when present', async () => {
        const router = new Router()
        router.use(requestIdCtx())
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ({requestId}) => {
                expect(requestId).toBe('req-123')
                return new Response(requestId)
            },
        })

        const response = await router.fetch(makeRequest({'x-request-id': 'req-123'}))

        expect(await response.text()).toBe('req-123')
    })

    it('falls back to an incrementing counter when missing', async () => {
        const router = new Router()
        const seen = new Set<string>()
        router.use(requestIdCtx())
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ({requestId}) => {
                expect(requestId).toMatch(/^\d+$/)
                seen.add(requestId)
                return new Response(requestId)
            },
        })

        const first = await router.fetch(makeRequest())
        const second = await router.fetch(makeRequest())

        expect(await first.text()).toBe('1')
        expect(await second.text()).toBe('2')
        expect(seen.size).toBe(2)
    })

    it('respects header order when multiple names are provided', async () => {
        const router = new Router()
        router.use(requestIdCtx({requestIdHeader: ['x-request-id', 'x-trace-id']}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ({requestId, req}) => {
                const headerId = req.headers.get('x-request-id')
                    ?? req.headers.get('x-trace-id')
                expect(requestId).toBe(headerId)
                return new Response(requestId)
            },
        })

        const fallback = await router.fetch(makeRequest({'x-trace-id': 'trace-456'}))
        const preferred = await router.fetch(makeRequest({
            'x-request-id': 'primary-789',
            'x-trace-id': 'secondary-000',
        }))

        expect(await fallback.text()).toBe('trace-456')
        expect(await preferred.text()).toBe('primary-789')
    })
})
