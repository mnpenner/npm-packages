#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {ApiClient, type Fetcher} from './api-client.gen'

type FetchCall = {
    url: string
    init: RequestInit
}

class RecordingFetcher implements Fetcher {
    calls: FetchCall[] = []

    fetch(url: string, init: RequestInit): unknown {
        this.calls.push({url, init})
        if (url.startsWith('/books/')) {
            const id = url.split('/').pop() ?? ''
            const body = init.body ? JSON.parse(init.body.toString()) : {}
            return new Response(JSON.stringify({id, ...body}), {
                headers: {'content-type': 'application/json'},
            })
        }
        return new Response(JSON.stringify({message: 'ok'}), {
            headers: {'content-type': 'application/json'},
        })
    }
}

describe('api-client.gen', () => {
    it('invokes fetcher with the generated routes', async () => {
        const fetcher = new RecordingFetcher()
        const client = new ApiClient(fetcher)

        const indexResponse = await client.get()
        expect(await indexResponse.json()).toEqual({message: 'ok'})

        const namedResponse = await client.namedRoute.get()
        expect(await namedResponse.json()).toEqual({message: 'ok'})

        const namedPostResponse = await client.namedRoute.post()
        expect(await namedPostResponse.json()).toEqual({message: 'ok'})

        const fooResponse = await client.foo.bar.post()
        expect(await fooResponse.json()).toEqual({message: 'ok'})

        const booksResponse = await client.booksById.post('123', {title: 'foo', author: 'bar'})
        expect(await booksResponse.json()).toEqual({id: '123', title: 'foo', author: 'bar'})

        const genResponse = await client.gen.get()
        expect(await genResponse.json()).toEqual({message: 'ok'})

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
