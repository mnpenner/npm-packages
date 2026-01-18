#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {ApiClient, type Fetcher} from './api-client.gen'
import {router} from './router-instance'
import {expectType, type TypeEqual} from '@mpen/server-router/testing/type-assert'

type FetchCall = {
    url: string
    init: RequestInit
}

class RecordingFetcher implements Fetcher {
    calls: FetchCall[] = []

    fetch(url: string, init: RequestInit): unknown {
        this.calls.push({url, init})
        return router.fetch(new Request(new URL(url, 'https://example.org'), init))
    }
}

describe('api-client.gen', () => {
    it('invokes fetcher with the generated routes', async () => {
        const fetcher = new RecordingFetcher()
        const client = new ApiClient(fetcher)

        const indexResponse = await client.get()
        expect(await indexResponse.json()).toEqual({message: 'Hello World!'})

        const namedResponse = await client.namedRoute.get()
        expect(await namedResponse.json()).toEqual({message: 'Hello World!'})

        const namedPostResponse = await client.namedRoute.post()
        expect(await namedPostResponse.json()).toEqual({message: 'Hello World!'})

        const fooResponse = await client.foo.bar.post()
        expect(await fooResponse.json()).toEqual({message: 'Hello World!'})

        const booksResponse = await client.booksById.post(123, {title: 'foo', author: 'bar'})
        const booksResponseData = await booksResponse.json()
        expectType<TypeEqual<typeof booksResponseData, {
            id: number,
            title: string,
            author: string,
        }>>(true)
        expect(booksResponseData).toEqual({id: 123, title: 'foo', author: 'bar'})

        const jsonHelperResponse = await client.jsonHelper.get()
        const jsonHelperData = await jsonHelperResponse.json()
        expectType<TypeEqual<typeof jsonHelperData, {message: string}>>(true)
        expect(jsonHelperData).toEqual({message: 'Hello Json Helper!'})

        const jsonHelperZodResponse = await client.jsonHelperZod.post({tag: 'alpha'})
        const jsonHelperZodData = await jsonHelperZodResponse.json()
        expectType<TypeEqual<typeof jsonHelperZodData, {ok: boolean, tag: string}>>(true)
        expect(jsonHelperZodData).toEqual({ok: true, tag: 'alpha'})

        const genResponse = await client.gen.get()
        expect(await genResponse.text()).toEqual('herro')

        expect(fetcher.calls).toEqual([
            {url: '/', init: {method: 'GET'}},
            {url: '/name/bar', init: {method: 'GET'}},
            {url: '/name/bar', init: {method: 'POST'}},
            {url: '/foo/bar', init: {method: 'POST'}},
            {
                url: '/books/123',
                init: {
                    method: 'POST',
                    headers: {'content-type': 'application/json'},
                    body: JSON.stringify({title: 'foo', author: 'bar'}),
                },
            },
            {url: '/json-helper', init: {method: 'GET'}},
            {
                url: '/json-helper-zod',
                init: {
                    method: 'POST',
                    headers: {'content-type': 'application/json'},
                    body: JSON.stringify({tag: 'alpha'}),
                },
            },
            {url: '/gen', init: {method: 'GET'}},
        ])
    })
})
