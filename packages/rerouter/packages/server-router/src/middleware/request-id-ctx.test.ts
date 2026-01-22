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
        const seenExtra: {prefix: string; hotReloadCounter: number; requestCounter: number}[] = []
        const generated: string[] = []
        const generate = (
            _ctx: unknown,
            extra: {prefix: string; hotReloadCounter: number; requestCounter: number}
        ) => {
            seenExtra.push(extra)
            const value = `${extra.prefix}.${extra.hotReloadCounter}.${extra.requestCounter}`
            generated.push(value)
            return value
        }
        router.use(requestIdCtx({generate, prefix: 'custom'}))
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

        expect(await first.text()).toMatch(/^custom\.\d+\.\d+$/)
        expect(await second.text()).toMatch(/^custom\.\d+\.\d+$/)
        expect(seenExtra).toHaveLength(2)
        expect(seenExtra[0]?.prefix).toBe('custom')
        expect(seenExtra[1]?.prefix).toBe('custom')
        expect(seenExtra[0]?.hotReloadCounter).toBe(seenExtra[1]?.hotReloadCounter)
        expect(seenExtra[0]?.requestCounter).toBe(1)
        expect(seenExtra[1]?.requestCounter).toBe(2)
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

    it('uses the default generator format when no header is provided', async () => {
        const router = new Router()
        router.use(requestIdCtx({prefix: 'req'}))
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ({requestId}) => {
                return new Response(requestId)
            },
        })

        const first = await router.fetch(makeRequest())
        const second = await router.fetch(makeRequest())

        const firstId = await first.text()
        const secondId = await second.text()

        expect(firstId).toBe('req.1')
        expect(secondId).toBe('req.2')
    })
})
