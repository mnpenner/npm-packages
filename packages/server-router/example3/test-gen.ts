#!/usr/bin/env -S bun
import { ApiClient, type Fetcher } from './router.gen'

class FakeFetcher implements Fetcher {
    fetch(url: string, init: RequestInit): Promise<Response> {
        console.log('fetching', url, init)
        return Promise.resolve(new Response())
    }
}

const client = new ApiClient(new FakeFetcher())

client.widgets.byId
    .post(123, { view: 'full' }, { name: 'Mark', tags: ['foo', 'bar'] })
    .then(console.log)
