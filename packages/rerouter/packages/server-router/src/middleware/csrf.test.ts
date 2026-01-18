#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {Router} from '../router'
import {csrf} from './csrf'

describe(csrf.name, () => {
    it('allows same-site fetch requests by default', async () => {
        const router = new Router()
        router.use(csrf())
        router.add({
            method: HttpMethod.POST,
            pattern: '/submit',
            handler: () => new Response('ok'),
        })

        const request = new Request('https://api.example.com/submit', {
            method: HttpMethod.POST,
            headers: {
                origin: 'https://app.example.com',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
            },
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.OK)
    })

    it('rejects cross-site origins by default', async () => {
        const router = new Router()
        router.use(csrf())
        router.add({
            method: HttpMethod.POST,
            pattern: '/submit',
            handler: () => new Response('ok'),
        })

        const request = new Request('https://api.example.com/submit', {
            method: HttpMethod.POST,
            headers: {
                origin: 'https://evil.example',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
            },
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.FORBIDDEN)
    })

    it('allows whitelisted origins even when cross-site', async () => {
        const router = new Router()
        router.use(csrf({allowedOrigins: ['https://evil.example']}))
        router.add({
            method: HttpMethod.POST,
            pattern: '/submit',
            handler: () => new Response('ok'),
        })

        const request = new Request('https://api.example.com/submit', {
            method: HttpMethod.POST,
            headers: {
                origin: 'https://evil.example',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
            },
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.OK)
    })

    it('allows local dev requests without fetch metadata or origin when dev is enabled', async () => {
        const router = new Router()
        router.use(csrf({dev: true}))
        router.add({
            method: HttpMethod.POST,
            pattern: '/submit',
            handler: () => new Response('ok'),
        })

        const request = new Request('http://localhost:8787/submit', {
            method: HttpMethod.POST,
        })

        const response = await router.fetch(request)

        expect(response.status).toBe(HttpStatus.OK)
    })
})
