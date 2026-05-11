#!/usr/bin/env -S bun
import { expectType } from '@mpen/ts-types'
import { ApiClient, type Fetcher } from './router.gen'

class FakeFetcher implements Fetcher {
    fetch(url: string, init: RequestInit): Promise<Response> {
        console.log('fetching', url, init)
        return Promise.resolve(new Response(JSON.stringify({"error":"msg"}), { status: 400 }))
    }
}

const client = new ApiClient(new FakeFetcher())

const res = await client.widgets.byId
    .post(123, { view: 'full' }, { name: 'Mark', tags: ['foo', 'bar'] })

if(res.status === 400) {
    const body = await res.json()
    expectType<string>(body.component)
}
