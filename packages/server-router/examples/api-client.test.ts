#!/usr/bin/env -S bun test
import { describe, expect, it } from 'bun:test'
import { ApiClient } from './api-client.gen'
import router from './router-instance'
import { expectType, type TypeEqual } from '@mpen/ts-types'
import type { BodyCodec } from '@mpen/server-router/client'

type FetchCall = {
    url: string
    init: RequestInit
}

describe('api-client.gen', () => {
    it('invokes fetcher with the generated routes', async () => {
        const calls: FetchCall[] = []
        const client = new ApiClient({
            fetch(url, init) {
                const href = String(url)
                calls.push({ url: href, init })
                return router.fetch(new Request(new URL(href, 'https://example.org'), init))
            },
        })

        const indexResponse = await client.get()
        expect(await indexResponse.json()).toEqual({ message: 'Hello World!' })

        const namedResponse = await client.namedRoute.get()
        expect(await namedResponse.json()).toEqual({ message: 'Hello World!' })

        const namedPostResponse = await client.namedRoute.post()
        expect(await namedPostResponse.json()).toEqual({ message: 'Hello World!' })

        const fooResponse = await client.foo.bar.post()
        expect(await fooResponse.json()).toEqual({ message: 'Hello World!' })

        const booksResponse = await client.booksById.post({
            path: 123,
            body: { title: 'foo', author: 'bar' },
        })
        const booksResponseData = await booksResponse.json()
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
        const jsonHelperData = await jsonHelperResponse.json()
        expectType<TypeEqual<typeof jsonHelperData, { message: string }>>(true)
        expect(jsonHelperData).toEqual({ message: 'Hello Json Helper!' })

        const jsonHelperZodResponse = await client.jsonHelperZod.post({ body: { tag: 'alpha' } })
        const jsonHelperZodData = await jsonHelperZodResponse.json()
        expectType<TypeEqual<typeof jsonHelperZodData, { ok: boolean; tag: string }>>(true)
        expect(jsonHelperZodData).toEqual({ ok: true, tag: 'alpha' })

        const healthResponse = await client.health.get()
        expect(await healthResponse.text()).toEqual('ok')

        const healthHeadResponse = await client.health.head()
        expect(await healthHeadResponse.text()).toEqual('')

        const submitResponse = await client.submit.post()
        expect(await submitResponse.text()).toEqual('submitted')

        const putResponse = await client.itemsById.put({ path: 123 })
        expect(await putResponse.text()).toEqual('updated')

        const deleteResponse = await client.itemsById.delete({ path: 123 })
        expect(await deleteResponse.text()).toEqual('deleted')

        const patchResponse = await client.itemsById.patch({ path: 123 })
        expect(await patchResponse.text()).toEqual('patched')

        const genResponse = await client.gen.get()
        expect(await genResponse.text()).toEqual('herro')

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
            contentType: 'application/x-test-json',
            serialize: (value) => `wrapped:${JSON.stringify(value)}`,
            deserialize: async (response) => ({
                raw: await response.text(),
            }),
        }
        const calls: FetchCall[] = []
        const client = new ApiClient({
            bodyCodec: codec,
            fetch(url, init) {
                const href = String(url)
                calls.push({ url: href, init })
                return Promise.resolve(new Response('ok'))
            },
        })

        const response = await client.jsonHelperZod.post({ body: { tag: 'alpha' } })

        expect(await response.json()).toEqual({ raw: 'ok' })
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
