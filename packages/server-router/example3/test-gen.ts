#!/usr/bin/env -S bun
import { expectType } from '@mpen/ts-types'
import { ApiClient } from './router.gen'
import type {
    ApiTransportResponsePromise,
    ClientRequest,
    ClientTransport,
} from '@mpen/server-router/client'

class FakeTransport implements ClientTransport {
    request<TResponse, TBody = unknown>(
        request: ClientRequest<TBody>,
    ): ApiTransportResponsePromise<TResponse> {
        console.log('request', request)
        const response = new Response(
            JSON.stringify({ component: 'request_body', message: 'msg' }),
            {
                status: 400,
            },
        )

        return Promise.resolve({
            response,
            status: response.status,
            headers: response.headers,
            parseBody: () => new Response(response.body).json() as Promise<TResponse>,
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
