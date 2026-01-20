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

    it('enforces ipv4 subnet limits', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => 'user-1',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 5,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            scales: {subnet: {ipv4: 0.2, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/ipv4',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/ipv4', {
            headers: {'x-forwarded-for': '203.0.113.10'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })

    it('enforces ipv6 subnet limits', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => 'user-1',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 5,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            scales: {subnet: {ipv4: 10, ipv6: 0.2}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/ipv6',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/ipv6', {
            headers: {'x-forwarded-for': '2001:db8:abcd:12::1'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })

    it('enforces country limits', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => 'user-1',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 5,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            getCountryCode: async () => 'US',
            scales: {
                subnet: {ipv4: 10, ipv6: 10},
                country: {US: 0.2, other: 1, unknown: 1},
            },
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/country',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/country', {
            headers: {'x-forwarded-for': '203.0.113.20'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })

    it('enforces ASN limits', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => 'user-1',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 5,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            getAsn: async () => ({asn: 15169, organization: 'Google'}),
            scales: {
                subnet: {ipv4: 10, ipv6: 10},
                asnClass: {cloud: 0.2, unknown: 1},
            },
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/asn',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/asn', {
            headers: {'x-forwarded-for': '203.0.113.30'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })

    it('uses a custom getIpAddress implementation', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,
            getIpAddress: async (ctx) => ctx.req.headers.get('x-test-ip') ?? 'unknown',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 1,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/custom-ip',
            handler: () => new Response('ok'),
        })

        const request = (ip: string) => new Request('https://example.com/custom-ip', {
            headers: {'x-test-ip': ip},
        })

        const response1 = await router.fetch(request('203.0.113.40'))
        const response2 = await router.fetch(request('198.51.100.42'))

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(200)
    })

    it('applies non-default baseWindowMs and anonymousIpMultiplier', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 2000,
            baseMaxRequestsPerBaseWindow: 2,
            anonymousIpMultiplier: 0.5,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 2000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/anon',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/anon', {
            headers: {'x-forwarded-for': '203.0.113.50'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })

    it('enforces multiple buckets', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => 'user-1',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 3,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [
                {windowMs: 1000, scale: 1},
                {windowMs: 4000, scale: 0.1},
            ],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/buckets',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/buckets', {
            headers: {'x-forwarded-for': '203.0.113.60'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })
})
