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

    it('uses the generate callback when missing a header', async () => {
        const router = new Router()
        const generated: string[] = []
        const generate = () => {
            const value = `generated-${generated.length + 1}`
            generated.push(value)
            return value
        }
        router.use(requestIdCtx({generate}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ({requestId}) => {
                expect(requestId).toBe(generated[generated.length - 1])
                return new Response(requestId)
            },
        })

        const first = await router.fetch(makeRequest())
        const second = await router.fetch(makeRequest())

        expect(await first.text()).toBe('generated-1')
        expect(await second.text()).toBe('generated-2')
        expect(generated).toEqual(['generated-1', 'generated-2'])
    })

    it('respects header order when multiple names are provided', async () => {
        const router = new Router()
        router.use(requestIdCtx({readHeaderName: ['x-request-id', 'x-trace-id']}))
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

    it('writes the request id into the response header when configured', async () => {
        const router = new Router()
        router.use(requestIdCtx({
            generate: () => 'req-42',
            writeHeaderName: 'x-request-id',
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ({requestId}) => {
                expect(requestId).toBe('req-42')
                return 'ok'
            },
        })

        const response = await router.fetch(makeRequest())

        expect(response.headers.get('x-request-id')).toBe('req-42')
        expect(await response.text()).toBe('ok')
    })
})
