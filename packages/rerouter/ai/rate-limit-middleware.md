Create `packages/server-router/src/middleware/rate-limit.ts`

An example of the options it should support is below.

```ts
import {URLPattern} from 'node:url'


interface Bucket {
    durationMs: number
    scale: number
}

interface AsnRecord {
    asn: number
    org: string
}

interface Options {
    getUserId(ctx): Promise<string | number>

    getIpAddress?(ctx): Promise<string>

    getGlobalPeakConcurrentUsers(ctx): Promise<number>

    addRetryAfterHeader: boolean
    /**
     * Input numbers are assumed to be per this number of milliseconds. Defaults to 1_000 (i.e. values are in QPS)
     */
    baseBucketDurationMs: number
    buckets: Bucket[]
    /** Filepath */
    maxmindAsnDatabase?: string
    /** Filepath */
    maxmindCountryDatabase?: string
    
    getAsn(ctx, {userId, ipAddress}): AsnRecord
    getCountryCode(ctx, {userId, ipAddress}): string
    
    endpointLimits: EndpointLimit[]
    
    asnToClass(number): string
}

const ASN_OVERRIDES: Record<number, string> = {
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
    getIpAddress(ctx) {
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

If `maxmindAsnDatabase` is set, then `getAsn` will use the default implementation, reading the maxmind database. If it's not set, the user can implement it themselves by defining `getAsn`. If neither are set, ASN limits will not apply.

Likewise for country.
