#!/usr/bin/env -S bun
import {ApiClient, type Fetcher} from './api-client.gen'

class BasicFetcher implements Fetcher {
    constructor(private readonly baseUrl: string) {
    }

    fetch(url: string, init: RequestInit) {
        const resolvedUrl = new URL(url, this.baseUrl).href
        console.log('Request',resolvedUrl,init)
        return fetch(resolvedUrl, init)
    }
}

// https://bun.com/docs/runtime/http/server#changing-the-port-and-hostname
const port = Bun.env.BUN_PORT || Bun.env.NODE_PORT || Bun.env.NODE_PORT || 3000
const client = new ApiClient(new BasicFetcher(`http://localhost:${port}`))


console.log('Response', await client.booksById.post({id: '123'}, {title: 'foo', author: 'bar'}).then(async r => ({
    headers: r.headers,
    status: r.status,
    body: await r.json(),
})))
