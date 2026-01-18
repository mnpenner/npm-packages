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
        return router.fetch(new Request(new URL(url,'https://example.org'), init))
        // if (url.startsWith('/books/')) {
        //     const id = url.split('/').pop() ?? ''
        //     const body = init.body ? JSON.parse(init.body.toString()) : {}
        //     return new Response(JSON.stringify({id, ...body}), {
        //         headers: {'content-type': 'application/json'},
        //     })
        // }
        // return new Response(JSON.stringify({message: 'ok'}), {
        //     headers: {'content-type': 'application/json'},
        // })
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
        }>>(true);
        expect(booksResponseData).toEqual({id: 123, title: 'foo', author: 'bar'})

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
            {url: '/gen', init: {method: 'GET'}},
        ])
    })
})
