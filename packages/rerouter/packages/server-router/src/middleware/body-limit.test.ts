#!/usr/bin/env -S bun test
import {describe, expect, it, mock} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router} from '../router'
import {bodyLimit} from './body-limit'

const encoder = new TextEncoder()

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
        },
    })
}

describe(bodyLimit.name, () => {
    it('rejects immediately when Content-Length exceeds maxSize', async () => {
        const router = new Router()
        const handler = mock(() => new Response('ok'))

        router.use(bodyLimit({maxSize: 9}))
        router.add({method: HttpMethod.POST, pattern: '/upload', handler})

        const request = new Request('https://example.com/upload', {
            method: HttpMethod.POST,
            headers: {'content-length': '10'},
            body: makeStream(['ok']),
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.PAYLOAD_TOO_LARGE)
        expect(handler).not.toHaveBeenCalled()
    })

    it('rejects when the streamed body exceeds maxSize', async () => {
        const router = new Router()

        router.use(bodyLimit({maxSize: 4}))
        router.add({
            method: HttpMethod.POST,
            pattern: '/upload',
            handler: async ({req}) => new Response(await req.text()),
        })

        const request = new Request('https://example.com/upload', {
            method: HttpMethod.POST,
            body: makeStream(['1234', '5']),
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.PAYLOAD_TOO_LARGE)
    })

    it('rejects when Content-Length does not match the received bytes', async () => {
        const router = new Router()

        router.use(bodyLimit({maxSize: 10}))
        router.add({
            method: HttpMethod.POST,
            pattern: '/upload',
            handler: async ({req}) => new Response(await req.text()),
        })

        const request = new Request('https://example.com/upload', {
            method: HttpMethod.POST,
            headers: {'content-length': '4'},
            body: makeStream(['abc']),
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    })

    it('allows requests within the limit and matching Content-Length', async () => {
        const router = new Router()

        router.use(bodyLimit({maxSize: 10}))
        router.add({
            method: HttpMethod.POST,
            pattern: '/upload',
            handler: async ({req}) => new Response(await req.text()),
        })

        const request = new Request('https://example.com/upload', {
            method: HttpMethod.POST,
            headers: {'content-length': '5'},
            body: makeStream(['hello']),
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.OK)
        expect(await response.text()).toBe('hello')
    })
})
