Create `packages/server-router/src/middleware/rate-limit.ts`.

Implement a configurable rate limiting middleware for this server framework.

The middleware enforces limits simultaneously across multiple “dimensions”:

* Per authenticated user (primary key: userId)
* Per anonymous IP (primary key: ipAddress; scaled up because NAT)
* Per subnet (IPv4 /24, IPv6 /64; always applied)
* Per ASN (optional; requires MaxMind ASN DB or user-supplied resolver)
* Per country (optional; requires MaxMind Country DB or user-supplied resolver)
* Per endpoint (method + path, with variants for “with normalized query” and “without query”)

The middleware uses a bucket system. A “bucket” defines a duration window and a scale. Limits are derived from a base rate reference.

Terminology:

* “Base rate”: `baseMaxRequestsPerBaseWindow` requests per `baseWindowMs`.
* For a bucket window `bucket.windowMs`, base max for that bucket is:

    * `bucketMax = floor(baseMaxRequestsPerBaseWindow * (bucket.windowMs / baseWindowMs) * bucket.scale)`

Then each dimension applies an additional multiplier (identity multipliers, country/ASN multipliers, subnet multipliers, etc).

The middleware must support a default in-memory LRU store, but also allow pluggable storage via `readCounter` / `writeCounter` (see below) so callers can use Redis or any datastore.

---

## Types / API

```ts
import {URLPattern} from 'node:url'

export interface RateBucket {
    windowMs: number
    scale: number
}

export interface AsnRecord {
    asn: number
    organization: string
}

export type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'

export type MethodLimit = number | Partial<Record<HttpMethod, number>>

export interface EndpointLimit {
    pattern: string | URLPattern | ConstructorParameters<typeof URLPattern>
    /**
     * Max requests per base window (baseWindowMs) for this endpoint, prior to bucket/window expansion.
     * If number: applies to all methods.
     * If object: per-method limits.
     */
    limit: MethodLimit
}

export type AsnClass =
    | 'cloud'
    | 'hosting'
    | 'cdn'
    | 'residential'
    | 'mobile'
    | 'unknown'
    | (string & {})  // allow user-defined strings

export interface FixedWindowCounter {
    windowStartMs: number
    count: number
}

export interface CounterReadResult {
    counter: FixedWindowCounter | null
}

export interface CounterWriteInput {
    counter: FixedWindowCounter
    /**
     * Milliseconds until this counter can be safely discarded.
     * For in-memory LRU this is used as the entry TTL.
     * For Redis, set key expiry to this.
     */
    ttlMs: number
}

export interface RateLimitStorage<C> {
    /**
     * Read the counter for a given key.
     */
    readCounter(ctx: C, key: string): Promise<CounterReadResult>
    /**
     * Persist the updated counter for a given key.
     */
    writeCounter(ctx: C, key: string, input: CounterWriteInput): Promise<void>
}

export interface RateLimitOptions<C> {
    // --- identity
    getUserId(ctx: C): Promise<string | number | null | undefined>

    /**
     * Default implementation should read X-Forwarded-For and/or X-Real-IP.
     * Only trust these if the deployment is behind a trusted proxy / LB.
     */
    getIpAddress?: (ctx: C) => Promise<string>

    /**
     * Used to scale country caps by concurrency.
     * Called once at middleware init.
     */
    getGlobalPeakConcurrentUsers: (ctx: C) => Promise<number>

    // --- base definition
    /**
     * Base reference window duration.
     * Defaults to 1_000 (i.e. base limit is QPS-style).
     */
    baseWindowMs: number

    /**
     * Base reference max requests per baseWindowMs, per authenticated user.
     * Bucket/window expansion is derived from this.
     */
    baseMaxRequestsPerBaseWindow: number

    /**
     * If userId is falsy, use ipAddress as the identity key but increase limits by this multiplier
     * to accommodate multiple users behind NAT.
     */
    anonymousIpMultiplier: number

    // --- response behavior
    addRetryAfterHeader: boolean

    // --- buckets
    buckets: RateBucket[]

    // --- query normalization for endpoint keys
    normalizeQuery?: (url: URL) => string

    // --- MaxMind (optional)
    /** File path to GeoLite2-ASN.mmdb */
    maxmindAsnDatabase?: string
    /** File path to GeoLite2-Country.mmdb */
    maxmindCountryDatabase?: string

    // --- ASN/Country resolvers (optional overrides)
    /**
     * If maxmindAsnDatabase is set and getAsn is not set, use default MaxMind lookup.
     * If getAsn is set, it overrides the default.
     * If neither is set, ASN limits are not applied.
     */
    getAsn?: (ctx: C, input: {userId: string|number|null|undefined; ipAddress: string}) => Promise<AsnRecord | null>

    /**
     * If maxmindCountryDatabase is set and getCountryCode is not set, use default MaxMind lookup.
     * If getCountryCode is set, it overrides the default.
     * If neither is set, country limits are not applied.
     */
    getCountryCode?: (ctx: C, input: {userId: string|number|null|undefined; ipAddress: string}) => Promise<string | null>

    // --- ASN classing (used for scaling)
    asnToClass?: (asn: number, organization: string) => AsnClass

    // --- scaling
    scales: {
        /**
         * Country scaling.
         * If IP->country is unknown => use `unknown` scale.
         * If known but not explicitly listed => use `other` scale.
         */
        country?: Record<string, number> & {unknown: number; other: number}

        /**
         * ASN class scaling. Only applied if ASN is available.
         * If class not listed => use `unknown`.
         */
        asnClass?: Record<string, number> & {unknown: number}

        /**
         * Subnet scaling. Always applied.
         */
        subnet: {
            ipv4: number  // multiplier for /24 bucket limits
            ipv6: number  // multiplier for /64 bucket limits
            /**
             * Optional multiplier layered on top of ipv4/ipv6 based on ASN class (if available).
             * Example: {cloud: 0.2, hosting: 0.2, residential: 1, unknown: 0.7}
             */
            byAsnClass?: Record<string, number> & {unknown: number}
            /**
             * Prefix sizes (defaults: 24 and 64).
             * Only support /24 for IPv4 and /64 for IPv6 unless you implement broader support.
             */
            ipv4Prefix?: 24
            ipv6Prefix?: 64
        }
    }

    // --- endpoint limits
    endpointLimits: EndpointLimit[]

    // --- storage
    /**
     * If provided, use this storage. Otherwise use an in-memory LRU implementation.
     */
    storage?: RateLimitStorage<C>

    /**
     * In-memory store sizing (used only if storage is not provided)
     */
    inMemory?: {
        maxEntries?: number
        /**
         * TTL for counters; default should be 10x the largest bucket window.
         */
        entryTtlMs?: number
    }
}
```

---

## Default ASN classification

Include a default `asnToClass` implementation with explicit overrides plus keyword heuristics.

```ts
const ASN_OVERRIDES: Record<number, AsnClass> = {
    16509: 'cloud',  // AWS
    15169: 'cloud',  // Google
    8075: 'cloud',   // Microsoft
    13335: 'cdn',    // Cloudflare
}

const CDN_KEYWORDS = ['cloudflare','fastly','akamai','cdn']
const CLOUD_KEYWORDS = ['amazon','aws','google','gcp','microsoft','azure','digitalocean','linode','vultr','ovh','hetzner','oracle','alibaba','tencent']
const HOSTING_KEYWORDS = ['hosting','host','colo','datacenter','data center','server']
const MOBILE_KEYWORDS = ['mobile','wireless','cellular','lte','5g']
const RESIDENTIAL_KEYWORDS = ['telecom','communications','broadband','cable','fiber']

function defaultAsnToClass(asn: number, organization: string): AsnClass {
    const override = ASN_OVERRIDES[asn]
    if (override) return override

    if (!organization) return 'unknown'
    const s = organization.toLowerCase()

    if (CDN_KEYWORDS.some(k => s.includes(k))) return 'cdn'
    if (CLOUD_KEYWORDS.some(k => s.includes(k))) return 'cloud'
    if (HOSTING_KEYWORDS.some(k => s.includes(k))) return 'hosting'
    if (MOBILE_KEYWORDS.some(k => s.includes(k))) return 'mobile'
    if (RESIDENTIAL_KEYWORDS.some(k => s.includes(k))) return 'residential'
    return 'unknown'
}
```

---

## Keys / Dimensions

For each request, derive these identifiers:

* `userId` via `getUserId(ctx)`

* `ipAddress` via `getIpAddress(ctx)` (or default implementation)

* `identityKey`:

    * if userId truthy: `user:${userId}`
    * else: `ip:${ipAddress}` and apply `anonymousIpMultiplier`

* Subnet key (always):

    * IPv4 /24: `ip24:${a}.${b}.${c}.0/24`
    * IPv6 /64: parse IPv6 and compute first 4 hextets:

        * `ip64:${h1}:${h2}:${h3}:${h4}::/64`
    * If IP parsing fails, use `subnet:unknown` (still a bucket)

* Country key (if enabled):

    * Resolve code `CC` or null
    * If null => `country:unknown`
    * Else => `country:${CC}` (scale uses either explicit CC, or `other` if not present)

* ASN key (if enabled):

    * Resolve `{asn, organization}` or null
    * Key: `asn:${asn}` and class via `asnToClass`
    * If null => `asn:unknown` and class `unknown`

* Endpoint keys:

    * Use `URLPattern` match against `ctx.req.url` (or equivalent). If multiple match, apply all (most strict wins).
    * Build method/path keys:

        * Without query: `route:${METHOD}:${pathname}`
        * With normalized query: `routeq:${METHOD}:${pathname}?${normalizedQuery}`
    * `normalizeQuery(url)` default:

        * stable sort all query params by (key, value)
        * preserve duplicates
        * percent-encode key/value
        * return `k=v&k2=v2...` (no leading '?')

---

## Enforcement / math

Compute the base bucket max for each bucket:

* `bucketMax = floor(baseMaxRequestsPerBaseWindow * (bucket.windowMs / baseWindowMs) * bucket.scale)`

Then apply per-dimension multipliers:

1. Identity bucket:

* multiplier = `1` if authenticated
* multiplier = `anonymousIpMultiplier` if anonymous
* max = `bucketMax * multiplier`

2. Subnet bucket (always):

* base multiplier = `scales.subnet.ipv4|ipv6` depending on IP version
* if ASN class known and `scales.subnet.byAsnClass` exists, multiply by `byAsnClass[class]` (or `unknown`)
* max = `bucketMax * subnetMultiplier`

3. Country bucket (optional):

* multiplier = `getScale(countryCode)`:

    * if code null => `scales.country.unknown`
    * else if code present in scales.country => that
    * else => `scales.country.other`
* multiply by `globalPeakConcurrentUsers`
* max = `bucketMax * globalPeakConcurrentUsers * multiplier`

4. ASN class bucket (optional):

* multiplier = `scales.asnClass[class]` or `scales.asnClass.unknown`
* max = `bucketMax * multiplier`

5. Endpoint bucket(s):

* For each matching EndpointLimit:

    * Convert its per-base-window limit into bucket-window max:

        * `endpointBucketMax = floor(endpointBaseLimit * (bucket.windowMs / baseWindowMs) * bucket.scale)`
    * Apply identity multiplier (anonymous multiplier if applicable)
    * Enforce both:

        * key including query normalized (route
