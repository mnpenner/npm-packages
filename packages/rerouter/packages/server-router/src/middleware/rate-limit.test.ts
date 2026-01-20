#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {HttpMethod} from '@mpen/http-helpers'
import {existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {Router} from '../router'
import {rateLimit} from './rate-limit'

const asnDbPath = fileURLToPath(new URL('../testing/GeoLite2-ASN.mmdb', import.meta.url))
const countryDbPath = fileURLToPath(new URL('../testing/GeoLite2-Country.mmdb', import.meta.url))
const hasMaxmindDbs = existsSync(asnDbPath) && existsSync(countryDbPath)

class CaptureStorage {
    keys: string[] = []

    async readCounter(_ctx: unknown, _key: string) {
        return null
    }

    async writeCounter(_ctx: unknown, key: string, _counter: unknown, _ttlMs: number) {
        this.keys.push(key)
    }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

    it('normalizes query params by default', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 10,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [{pattern: '/search', limit: {GET: 1}}],
            includeQueryInEndpointKey: true,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/search',
            handler: () => new Response('ok'),
        })

        const request1 = new Request('https://example.com/search?a=1&b=2', {
            headers: {'x-forwarded-for': '203.0.113.70'},
        })
        const request2 = new Request('https://example.com/search?b=2&a=1', {
            headers: {'x-forwarded-for': '203.0.113.70'},
        })

        const response1 = await router.fetch(request1)
        const response2 = await router.fetch(request2)

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
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

    it('uses ipv4-mapped IPv6 addresses as ipv4', async () => {
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
            pattern: '/ipv4-mapped',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/ipv4-mapped', {
            headers: {'x-forwarded-for': '::ffff:203.0.113.80'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })

    it('uses ipv4Prefix:32 so subnet keys are per-IP (no grouping)', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,  // force identity=ip so subnet layer is what we’re testing
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 5,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            // subnet max = bucketMax * ipv4 scale = 5 * 0.2 = 1 request per /prefix per second
            scales: {subnet: {ipv4: 0.2, ipv6: 10, ipv4Prefix: 32}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/ipv4-prefix',
            handler: () => new Response('ok'),
        })

        const request = (ip: string) => new Request('https://example.com/ipv4-prefix', {
            headers: {'x-forwarded-for': ip},
        })

        // Different IPs => different /32 subnet keys => both allowed (each gets 1)
        const r1 = await router.fetch(request('203.0.113.10'))
        const r2 = await router.fetch(request('203.0.113.11'))

        // Second request from same IP => same /32 subnet key => blocked
        const r3 = await router.fetch(request('203.0.113.10'))
        const r4 = await router.fetch(request('203.0.113.11'))

        expect(r1.status).toBe(200)
        expect(r2.status).toBe(200)
        expect(r3.status).toBe(429)
        expect(r4.status).toBe(429)
    })

    it('uses ipv4Prefix:16 so all IPs in the same /16 share a subnet bucket', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,  // force identity=ip; subnet layer is under test
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 5,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            // subnet max = 5 * 0.2 = 1 request per /16 per second
            scales: {subnet: {ipv4: 0.2, ipv6: 10, ipv4Prefix: 16}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/ipv4-prefix',
            handler: () => new Response('ok'),
        })

        const request = (ip: string) => new Request('https://example.com/ipv4-prefix', {
            headers: {'x-forwarded-for': ip},
        })

        // Same /16: 203.0.0.0/16
        const r1 = await router.fetch(request('203.0.113.10'))
        const r2 = await router.fetch(request('203.0.200.42'))

        // Different /16: 198.51.0.0/16
        const r3 = await router.fetch(request('198.51.100.5'))

        expect(r1.status).toBe(200)
        // Second request from same /16 exceeds subnet bucket
        expect(r2.status).toBe(429)

        // Different /16 should not be affected
        expect(r3.status).toBe(200)
    })

    it('uses custom ipv6Prefix for subnet grouping', async () => {
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
            scales: {subnet: {ipv4: 10, ipv6: 0.2, ipv6Prefix: 128}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/ipv6-prefix',
            handler: () => new Response('ok'),
        })

        const request = (ip: string) => new Request('https://example.com/ipv6-prefix', {
            headers: {'x-forwarded-for': ip},
        })

        const response1 = await router.fetch(request('2001:db8:abcd:12::1'))
        const response2 = await router.fetch(request('2001:db8:abcd:12::2'))
        const response3 = await router.fetch(request('2001:db8:abcd:12::1'))

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(200)
        expect(response3.status).toBe(429)
    })

    it('prefixes subnet keys to avoid collisions', async () => {
        const storage = new CaptureStorage()
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => 'user-1',
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 1,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            storage,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/subnet-prefix',
            handler: () => new Response('ok'),
        })

        await router.fetch(new Request('https://example.com/subnet-prefix', {
            headers: {'x-forwarded-for': '203.0.113.90'},
        }))

        expect(storage.keys.some((key) => key.startsWith('subnet:'))).toBe(true)
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


    it.skipIf(!hasMaxmindDbs)('enforces ASN limits via MaxMind database', async () => {
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
            maxmindAsnDatabase: asnDbPath,
            scales: {
                subnet: {ipv4: 10, ipv6: 10},
                asnClass: {cloud: 0.2, unknown: 1},
            },
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/asn-maxmind',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/asn-maxmind', {
            headers: {'x-forwarded-for': '8.8.8.8'},
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

    it.skipIf(!hasMaxmindDbs)('enforces country limits via MaxMind database', async () => {
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
            maxmindCountryDatabase: countryDbPath,
            scales: {
                subnet: {ipv4: 10, ipv6: 10},
                country: {US: 0.2, other: 1, unknown: 1},
            },
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/country-maxmind',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/country-maxmind', {
            headers: {'x-forwarded-for': '8.8.8.8'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
    })

    it.skipIf(!hasMaxmindDbs)('falls back to registered country from MaxMind', async () => {
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
            maxmindCountryDatabase: countryDbPath,
            scales: {
                subnet: {ipv4: 10, ipv6: 10},
                country: {AU: 0.2, other: 1, unknown: 1},
            },
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/country-registered',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/country-registered', {
            headers: {'x-forwarded-for': '1.1.1.1'},
        })

        const response1 = await router.fetch(request())
        const response2 = await router.fetch(request())

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(429)
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

    it('does not expire in-memory counters before the window resets', async () => {
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 1,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [],
            includeQueryInEndpointKey: false,
            inMemory: {ttlMs: 10},
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/ttl',
            handler: () => new Response('ok'),
        })

        const request = () => new Request('https://example.com/ttl', {
            headers: {'x-forwarded-for': '203.0.113.100'},
        })

        const response1 = await router.fetch(request())
        await delay(30)
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

    it('omits query separator when the query is empty', async () => {
        const storage = new CaptureStorage()
        const router = new Router()
        router.use(rateLimit({
            getUserId: async () => null,
            getGlobalPeakConcurrentUsers: async () => 1,
            baseWindowMs: 1000,
            baseMaxRequestsPerBaseWindow: 1,
            anonymousIpMultiplier: 1,
            addRetryAfterHeader: false,
            buckets: [{windowMs: 1000, scale: 1}],
            endpointLimits: [{pattern: '/empty-query', limit: {GET: 1}}],
            includeQueryInEndpointKey: true,
            storage,
            scales: {subnet: {ipv4: 10, ipv6: 10}},
        }))
        router.add({
            method: HttpMethod.GET,
            pattern: '/empty-query',
            handler: () => new Response('ok'),
        })

        await router.fetch(new Request('https://example.com/empty-query', {
            headers: {'x-forwarded-for': '203.0.113.110'},
        }))

        expect(storage.keys.some((key) => key.includes('routeq:GET:/empty-query?'))).toBe(false)
    })
})
