#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {Router} from '../router'
import {acceptCtx} from './accept-ctx'

describe(acceptCtx.name, () => {
    it('adds parsed Accept header values to the context', async () => {
        const router = new Router()

        router.use(acceptCtx())
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: ({accept}) => new Response(JSON.stringify(accept)),
        })

        const request = new Request('https://example.com/', {
            headers: {accept: 'text/plain;q=0.5, application/json, text/html;q=0.9'},
        })

        const response = await router.fetch(request)

        expect(await response.json()).toEqual([
            {type: 'application/json', q: 1},
            {type: 'text/html', q: 0.9},
            {type: 'text/plain', q: 0.5},
        ])
    })
})
