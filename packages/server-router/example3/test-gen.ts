#!/usr/bin/env -S bun
import { expectType } from '@mpen/ts-types'
import { ApiClient } from './router.gen'

const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    fetch(url, init): Promise<Response> {
        console.log('fetching', url, init)
        return Promise.resolve(
            new Response(JSON.stringify({ component: 'request_body', message: 'msg' }), {
                status: 400,
            }),
        )
    },
})

const res = await client.widgets.byId.post({
    path: 123,
    query: { view: 'full' },
    body: { name: 'Mark', tags: ['foo', 'bar'] },
})

if (res.status === 400) {
    const body = await res.json()
    expectType<string>(body.message)
}
