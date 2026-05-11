#!/usr/bin/env -S bun
import { expectType } from '@mpen/ts-types'
import { ApiClient } from './router.gen'
import type { ApiResponsePromise, ClientRequest, ClientTransport } from '@mpen/server-router/client'

class FakeTransport implements ClientTransport {
    request<TResponse, TBody = unknown>(
        request: ClientRequest<TBody>,
    ): ApiResponsePromise<TResponse> {
        console.log('request', request)
        const response = new Response(
            JSON.stringify({ component: 'request_body', message: 'msg' }),
            {
                status: 400,
            },
        )

        return Promise.resolve({
            response,
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            parseBody: () => response.clone().json() as Promise<TResponse>,
        })
    }
}

const client = new ApiClient(new FakeTransport())

const res = await client.widgets.byId.post({
    path: 123,
    query: { view: 'full' },
    body: { name: 'Mark', tags: ['foo', 'bar'] },
})

if (res.status === 400) {
    const body = await res.parseBody()
    expectType<string>(body.message)
}
