create `packages/server-router/src/middleware/rate-limit.ts`

it should have options:

- getUserId(ctx): Promise<string|number>
- getIp(ctx): Promise<string>
- getPeakConcurrentUsers(ctx): Promise<number>  // ran once at startup
- retryAfterHeader: boolean  // add Retry-After header

If getUserId returns a falsy value, then rate limit will be applied against ip address instead, multiplied by some value to accomodate possible multiple users running on same IP.

IP should be converted to a country so we can have per-country limits (applied whether or not user is logged in)

We should try to fingerprint the user from the request headers and apply a rate limit per fingerprint. Or maybe not because these headers are easy to forge.

There will be a limit on the total # of requests from a user/ip/country, and then per-path with and without query params. Query params should be normalized.

e.g. we might specify that a user might make up to 3 requests to a particular endpoint per 6 seconds. Then we can smooth this out by multiplying...

- Max 3*5=15 requests per 6*5=30 seconds per user to GET /foo/bar?with=query_string
- Max 3*5=15 requests per 6*5=30 seconds per user to POST /foo/bar without query string
- If user ID is falsy, then per-IP limits apply but at 10x the rate. So 150 requests per 30 seconds per IP
- Then the per-country limits are scaled by the peak concurrent users and # of humans per country

`getIp` can look at `X-Forwarded-For` and/or `X-Real-IP` headers by default.

```ts
import {URLPattern} from 'node:url'


interface Bucket {
    durationMs: number
    scale: number
}


interface Options {
    getUserId(ctx): Promise<string | number>

    getIp(ctx): Promise<string>

    getGlobalPeakConcurrentUsers(ctx): Promise<number>

    addRetryAfterHeader: boolean
    /**
     * Input numbers are assumed to be per this number of milliseconds. Defaults to 1_000 (i.e. values are in QPS)
     */
    baseBucketDurationMs: number
    buckets: Bucket[]
    /**
     * Filepath
     */
    maxmindAsnDatabase: string
    maxmindCountryDatabase: string
    
    endpointLimits: EndpointLimit[]
    
    asnToClass(number): string
}

const ASN_OVERRIDES: Record<number, AsnClass> = {
    16509: 'cloud',      // AWS
    15169: 'cloud',      // Google
    8075:  'cloud',      // Microsoft
    13335: 'cdn',        // Cloudflare
}

function defaultAsnToClass(asn: number, org: string): string {
    if(ASN_OVERRIDES.has(asn)) return ASN_OVERRIDES.get(asn)

    if (!org) return 'unknown'
    const s = org.toLowerCase()

    if (CDN_KEYWORDS.some(k => s.includes(k))) return 'cdn'
    if (CLOUD_KEYWORDS.some(k => s.includes(k))) return 'cloud'
    if (HOSTING_KEYWORDS.some(k => s.includes(k))) return 'hosting'
    if (MOBILE_KEYWORDS.some(k => s.includes(k))) return 'mobile'
    if (RESIDENTIAL_KEYWORDS.some(k => s.includes(k))) return 'residential'

    return 'unknown'
}

type Limit = number | {
    GET?: number
    POST?: number
    PUT?: number
    PATCH?: number
    DELETE?: number
}

interface EndpointLimit {
    pattern: string | URLPattern | ConstructorParameters<URLPattern>
    limit: Limit
}

// Example
import countryDb from './data/GeoLite2-Country.mmdb'
import asnDb from './data/GeoLite2-ASN.mmdb'

const config = {
    getUserId(ctx) {
        return ctx.req.headers.get('x-user-id')
    },
    getIp(ctx) {
        return ctx.req.headers.get('x-forwarded-for').split(',', 2)[0].trim()
    },
    getGlobalPeakConcurrentUsers(ctx) {
        return ctx.db.query(/*sql*/)
    },
    maxmindCountryDatabase: countryDb,
    maxmindAsnDatabase: asnDb,
    addRetryAfterHeader: true,
    baseBucketDurationMs: 6_000,
    globalMaxPerUserQueries: 15,
    anonUserIpMultiplier: 10,
    buckets: [
        {
            durationMs: 30_000,
            scale: 1,
        },
        {
            durationMs: 1_000 * 60 * 5,
            scale: .9,
        },
        {
            durationMs: 1_000 * 60 * 75,
            scale: .8,
        },
        {
            durationMs: 1_000 * 60 * 60 * 20,
            scale: .7,
        },
    ],
    scales: {
        country: {
            US: .85,
            CA: .10,
            UK: .05,
            unknown: .10,
            other: .02,
        },
        asn: {
            cloud: .2,
            cdn: .1,
            residential: 1,
            unknown: .7,
        },
    },
    endpointLimits: [
        {
            pattern: '/users/*',
            limit: 5,
        },
        {
            pattern: '/comments/*',
            limit: {
                GET: 10,
                POST: 2,
            }
        }
    ],
}
```

Here we specify each user can make a max of 15 queries per 6 seconds, but this is just used as the base reference point to calculate the buckets.

Buckets:

1. 30_000/6_000*15*1 = 75 queries per 30 seconds (avg 2.5 QPS)
2. 300000/6_000*15*.9 = 675 queries per 5 minutes (avg 2.25 QPS)
3. 4500000/6_000*15*.8 = 9000 queries per 75 minutes (avg 2 QPS)
4. 72000000/6_000*15*.7 = 126_000 queries per 20 hours (avg 1.75 QPS)

These user the user's ID as a key for each bucket.

If the user is not logged in, then we use their IP address for the bucket key but with higher limits in case multiple users share an IP. The multiplier is specified in anonUserIpMultiplier.

Next we use the global peak concurrent users and multiply by the country scale. So for example if getGlobalPeakConcurrentUsers is 100, then the max for the first bucket for US would be:

1. 30_000/6_000*15*100*1*.85 = 6375 queries per 30 seconds (which is 85x the per-user max)

`scales.country` needn't sum to one if you don't know your exact user distribution. If the country cannot be determined from the user's IP using the maxmind DB, the `unknown` limit will apply. If the country *can* be determined by isn't specified in `scales.country`, then `other` will apply. To be clear, there will be no "other" bucket in the cache, it will use the real country code but with the "other" limit. "unknown" (or "ZZ") will be a real bucket.


