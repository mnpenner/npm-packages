#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {Router} from '../router'
import {rateLimit} from './rate-limit'

describe(rateLimit.name, () => {
    it('enforces per-user identity limits', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => 'user-1',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 2,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/',
            handler: () => new Response('ok'),
        })

        const makeRequest = () => new Request('https://example.com/', {
            headers: {'x-forwarded-for': '203.0.113.5'},
        })

        const response1 = await router.fetch(makeRequest())
        const response2 = await router.fetch(makeRequest())
        const response3 = await router.fetch(makeRequest())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(200)
        expect(response3.status).toBe(429)
    })

    it('applies endpoint limits to identity and subnet', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 100,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: true,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [{pattern: '/limited', limit: {GET: 1}}],
            includeQueryInEndpointKey: false,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/limited',
            handler: () => new Response('ok'),
        })

        const makeRequest = () => new Request('https://example.com/limited', {
            headers: {'x-forwarded-for': '203.0.113.7'},
        })

        const response1 = await router.fetch(makeRequest())
        const response2 = await router.fetch(makeRequest())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
        expect(response2.headers.get('retry-after')).not.toBeNull()
    })
})
