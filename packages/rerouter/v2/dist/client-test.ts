#!/usr/bin/env -S bun
import {CustomApiClient} from './api-client.gen'

class Fetcher {
    constructor(private readonly baseUrl: string) {}

    fetch(url: string, init: RequestInit) {
        const req = new Request(new URL(url, this.baseUrl).href, init)
        console.log(req)
        return fetch(req)
    }
}

// https://bun.com/docs/runtime/http/server#changing-the-port-and-hostname
const port = Bun.env.BUN_PORT || Bun.env.NODE_PORT || Bun.env.NODE_PORT || 3000
const client = new CustomApiClient(new Fetcher(`http://localhost:${port}`))


console.log(await client.BooksById.post({id: '123'}, {title: 'foo', author: 'bar'}))
