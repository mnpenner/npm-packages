#!/usr/bin/env -S bun test
import { describe, expect, it } from 'bun:test'
import { ApiClient } from './api-client.gen'
import router from './router-instance'
import { expectType, type TypeEqual } from '@mpen/ts-types'
import { FetchTransport, type BodyCodec, type ResponseBodyReader } from '@mpen/server-router/client'

type FetchCall = {
    url: string
    init: RequestInit
}

describe('api-client.gen', () => {
    it('invokes fetcher with the generated routes', async () => {
        const calls: FetchCall[] = []
        const client = new ApiClient(
            new FetchTransport({
                async fetch(url, init) {
                    const href = String(url)
                    calls.push({ url: href, init: init ?? {} })
                    const response = await router.fetch(
                        new Request(new URL(href, 'https://example.org').toString(), init),
                    )
                    return new Response(await response.arrayBuffer(), response)
                },
            }),
        )

        const indexResponse = await client.get()
        expect(await indexResponse.parseBody()).toEqual({ message: 'Hello World!' })

        const namedResponse = await client.namedRoute.get()
        expect(await namedResponse.parseBody()).toEqual({ message: 'Hello World!' })

        const namedPostResponse = await client.namedRoute.post()
        expect(await namedPostResponse.parseBody()).toEqual({ message: 'Hello World!' })

        const fooResponse = await client.foo.bar.post()
        expect(await fooResponse.parseBody()).toEqual({ message: 'Hello World!' })

        const booksResponse = await client.booksById.post({
            path: 123,
            body: { title: 'foo', author: 'bar' },
            headers: { 'content-type': 'application/json' },
        })
        const booksResponseData = await booksResponse.parseBody()
        expectType<
            TypeEqual<
                typeof booksResponseData,
                {
                    id: number
                    title: string
                    author: string
                }
            >
        >(true)
        expect(booksResponseData).toEqual({ id: 123, title: 'foo', author: 'bar' })

        const jsonHelperResponse = await client.jsonHelper.get()
        const jsonHelperData = await jsonHelperResponse.parseBody()
        expectType<TypeEqual<typeof jsonHelperData, { message: string }>>(true)
        expect(jsonHelperData).toEqual({ message: 'Hello Json Helper!' })

        const jsonHelperZodResponse = await client.jsonHelperZod.post({
            body: { tag: 'alpha' },
            headers: { 'content-type': 'application/json' },
        })
        const jsonHelperZodData = await jsonHelperZodResponse.parseBody()
        expectType<TypeEqual<typeof jsonHelperZodData, { ok: boolean; tag: string }>>(true)
        expect(jsonHelperZodData).toEqual({ ok: true, tag: 'alpha' })

        const healthResponse = await client.health.get()
        expect(healthResponse.ok).toBe(true)

        const healthHeadResponse = await client.health.head()
        expect(healthHeadResponse.status).toBe(200)

        const submitResponse = await client.submit.post()
        expect(submitResponse.ok).toBe(true)

        const putResponse = await client.itemsById.put({ path: 123 })
        expect(putResponse.ok).toBe(true)

        const deleteResponse = await client.itemsById.delete({ path: 123 })
        expect(deleteResponse.ok).toBe(true)

        const patchResponse = await client.itemsById.patch({ path: 123 })
        expect(patchResponse.ok).toBe(true)

        const genResponse = await client.gen.get()
        expect(genResponse.headers.get('x-foo')).toBe('bar')

        expect(calls).toEqual([
            { url: '/', init: { method: 'GET' } },
            { url: '/name/bar', init: { method: 'GET' } },
            { url: '/name/bar', init: { method: 'POST' } },
            { url: '/foo/bar', init: { method: 'POST' } },
            {
                url: '/books/123',
                init: {
                    method: 'POST',
                    headers: new Headers({ 'content-type': 'application/json' }),
                    body: JSON.stringify({ title: 'foo', author: 'bar' }),
                },
            },
            { url: '/json-helper', init: { method: 'GET' } },
            {
                url: '/json-helper-zod',
                init: {
                    method: 'POST',
                    headers: new Headers({ 'content-type': 'application/json' }),
                    body: JSON.stringify({ tag: 'alpha' }),
                },
            },
            { url: '/health', init: { method: 'GET' } },
            { url: '/health', init: { method: 'HEAD' } },
            { url: '/submit', init: { method: 'POST' } },
            { url: '/items/123', init: { method: 'PUT' } },
            { url: '/items/123', init: { method: 'DELETE' } },
            { url: '/items/123', init: { method: 'PATCH' } },
            { url: '/gen', init: { method: 'GET' } },
        ])
    })

    it('supports custom body codecs', async () => {
        const codec: BodyCodec = {
            serialize: (value) => `wrapped:${JSON.stringify(value)}`,
            deserialize: async <T>(body: ResponseBodyReader, contentType: string | null) =>
                ({
                    contentType,
                    raw: await new Response(body).text(),
                }) as T,
        }
        const calls: FetchCall[] = []
        const client = new ApiClient(
            new FetchTransport({
                bodyCodec: codec,
                headers: { 'content-type': 'application/x-test-json' },
                fetch(url, init) {
                    const href = String(url)
                    calls.push({ url: href, init: init ?? {} })
                    return Promise.resolve(new Response('ok'))
                },
            }),
        )

        const response = await client.jsonHelperZod.post({ body: { tag: 'alpha' } })

        expect((await response.parseBody()) as unknown).toEqual({ contentType: null, raw: 'ok' })
        expect(calls).toEqual([
            {
                url: '/json-helper-zod',
                init: {
                    method: 'POST',
                    headers: new Headers({ 'content-type': 'application/x-test-json' }),
                    body: 'wrapped:{"tag":"alpha"}',
                },
            },
        ])
    })
})
