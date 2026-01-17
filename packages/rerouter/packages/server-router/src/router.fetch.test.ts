#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router} from './router'

describe('Router.fetch', () => {
    it('binds handler this to the matching router instance', async () => {
        const router = new Router()
        let boundRouter: Router | null = null
        router.add({
            method: HttpMethod.GET,
            pattern: '/ping',
            handler: function () {
                boundRouter = this
                return new Response('ok')
            },
        })

        const response = await router.fetch(new Request('https://example.com/ping'))

        expect(response.status).toBe(HttpStatus.OK)
        expect(boundRouter === router).toBe(true)
    })

    it('binds handlers to mounted routers', async () => {
        const parent = new Router()
        const child = new Router()
        let boundRouter: Router | null = null
        child.add({
            method: HttpMethod.GET,
            pattern: '/nested',
            handler: function () {
                boundRouter = this
                return new Response('ok')
            },
        })
        parent.mount('/api', child)

        const response = await parent.fetch(new Request('https://example.com/api/nested'))

        expect(response.status).toBe(HttpStatus.OK)
        expect(boundRouter === child).toBe(true)
    })
})
