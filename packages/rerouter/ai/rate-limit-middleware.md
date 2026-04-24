Create `packages/server-router/src/middleware/rate-limit.ts`.

Implement a configurable rate limiting middleware for this server framework.

The middleware enforces limits simultaneously across multiple dimensions:

- Per authenticated user
- Per anonymous IP (scaled to tolerate NAT)
- Per subnet (IPv4 /24, IPv6 /64; always applied)
- Per ASN (optional; local MaxMind or user resolver)
- Per country (optional; local MaxMind or user resolver)
- Per endpoint (method + path, with optional normalized query)

All limits are derived from a single base rate reference and expanded into
multiple fixed-window buckets.

No network calls. All geo/ASN resolution must be local.

---

## Terminology

- **Base window**: `baseWindowMs`
- **Base limit**: `baseMaxRequestsPerBaseWindow`
- **Bucket**: `(windowMs, scale)`
- **Bucket max**:


bucketMax =
floor(
baseMaxRequestsPerBaseWindow
* (bucket.windowMs / baseWindowMs)
* bucket.scale
  )

````

Each dimension applies additional multipliers to this bucketMax.

---

## Public API

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
     * Max requests per baseWindowMs before bucket expansion.
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
    | (string & {})

export interface FixedWindowCounter {
    resetAtMs: number
    count: number
}

export interface RateLimitStorage<C> {
    /**
     * Return null/undefined if missing or expired.
     */
    readCounter(ctx: C, key: string): Promise<FixedWindowCounter | null | undefined>

    /**
     * ttlMs MUST be respected by the implementation.
     * Redis implementations should set key expiry accordingly.
     */
    writeCounter(
        ctx: C,
        key: string,
        counter: FixedWindowCounter,
        ttlMs: number
    ): Promise<void>
}
````

---

## Options

```ts
export interface RateLimitOptions<C> {
    // --- identity
    getUserId(ctx: C): Promise<string | number | null | undefined>

    /**
     * Default implementation:
     * - X-Forwarded-For (first IP)
     * - else X-Real-IP
     */
    getIpAddress?: (ctx: C) => Promise<string>

    /**
     * Used to scale country + ASN caps.
     * Called once during initialization.
     */
    getGlobalPeakConcurrentUsers(ctx: C): Promise<number>

    // --- base definition
    baseWindowMs: number
    baseMaxRequestsPerBaseWindow: number

    /**
     * Applied when userId is falsy and identity falls back to IP.
     */
    anonymousIpMultiplier: number

    addRetryAfterHeader: boolean

    // --- buckets
    buckets: RateBucket[]

    // --- endpoint handling
    normalizeQuery?: (url: URL) => string
    endpointLimits: EndpointLimit[]
    includeQueryInEndpointKey: boolean

    // --- MaxMind (optional)
    maxmindAsnDatabase?: string
    maxmindCountryDatabase?: string

    // --- resolvers (optional overrides)
    getAsn?(
        ctx: C,
        input: {userId: string | number | null | undefined; ipAddress: string}
    ): Promise<AsnRecord | null>

    getCountryCode?(
        ctx: C,
        input: {userId: string | number | null | undefined; ipAddress: string}
    ): Promise<string | null>

    // --- ASN classification
    asnToClass?: (asn: number, organization: string) => AsnClass

    // --- scaling
    scales: {
        country?: Record<string, number> & {
            unknown: number
            other: number
        }

        asnClass?: Record<string, number> & {
            unknown: number
        }

        subnet: {
            ipv4: number
            ipv6: number
            byAsnClass?: Record<string, number> & {unknown: number}
            ipv4Prefix?: 24   // default
            ipv6Prefix?: 64   // default
        }
    }

    // --- storage
    /**
     * If omitted, use in-memory LRU store.
     */
    storage?: RateLimitStorage<C>

    inMemory?: {
        maxEntries?: number
        /**
         * Defaults to the largest bucket.windowMs.
         * Implementations MAY extend (e.g. 2x) for safety.
         */
        ttlMs?: number
    }
}
```

---

## TTL rules (important)

* **entry TTL does NOT need to be user-configured**
* Default TTL = `max(bucket.windowMs)`
* This is sufficient because:

    * counters reset when `now >= resetAtMs`
    * after the largest bucket expires, the key is no longer needed
* Allow override **only** for advanced use (Redis tuning)

---

## Key derivation

### Identity

* if userId truthy:

    * `identity:user:${userId}`
    * multiplier = `1`
* else:

    * `identity:ip:${ipAddress}`
    * multiplier = `anonymousIpMultiplier`

### Subnet (always)

* IPv4 `/24`:

    * `ip24:${a}.${b}.${c}.0/24`
* IPv6 `/64`:

    * parse IPv6 → first 64 bits
    * `ip64:${h1}:${h2}:${h3}:${h4}::/64`
* If parsing fails:

    * `subnet:unknown`

### Country (optional)

* null → `country:unknown`
* known but not listed → scale `other`
* key always uses real country code

### ASN (optional)

* null → `asn:unknown`
* else:

    * key: `asn:${asn}`
    * class via `asnToClass`

### Endpoint

* pathname from URL
* method uppercased
* if includeQueryInEndpointKey:

    * normalizeQuery(url)
* keys:

    * `route:${METHOD}:${pathname}`
    * `routeq:${METHOD}:${pathname}?${query}`

---

## Enforcement order (all apply)

For each bucket:

1. **Identity**
2. **Subnet**
3. **ASN** (if enabled)
4. **Country** (if enabled)
5. **Endpoint × Identity**
6. **Endpoint × Subnet**

Any rejection → 429.

---

## Scaling math

Let `bucketMax` be the base bucket max.

### Identity

```
max = bucketMax * identityMultiplier
```

### Subnet

```
subnetMultiplier =
  scales.subnet.ipv4|ipv6
  * (byAsnClass[class] ?? 1)

max = bucketMax * subnetMultiplier
```

### ASN

```
max =
  bucketMax
  * scales.asnClass[class]
  * globalPeakConcurrentUsers
```

### Country

```
max =
  bucketMax
  * scales.country[countryCode | other | unknown]
  * globalPeakConcurrentUsers
```

### Endpoint

* Convert endpoint base limit → bucket limit
* Apply:

    * identity multiplier
    * subnet multiplier
* Enforce both identity-keyed and subnet-keyed endpoint buckets

---

## Storage behavior

* If `storage` provided:

    * Use `readCounter` / `writeCounter`
    * Pass TTL = largest bucket.windowMs
* Else:

    * In-memory LRU:

        * key → counter + expiry
        * maxEntries default: 100_000
        * TTL default: largest bucket.windowMs

---

## Default ASN classification

Include a built-in classifier:

```ts
const ASN_OVERRIDES = {
  16509: 'cloud',
  15169: 'cloud',
  8075: 'cloud',
  13335: 'cdn',
}

const KEYWORDS = {
  cdn: ['cloudflare','fastly','akamai','cdn'],
  cloud: ['amazon','aws','google','gcp','azure','digitalocean','linode','vultr','ovh','hetzner'],
  hosting: ['hosting','host','datacenter','server'],
  mobile: ['mobile','wireless','lte','5g'],
  residential: ['telecom','broadband','cable','fiber'],
}
```

---

## Final notes

* ASN and country limits **must scale with peakConcurrentUsers**
* Subnet limits are the **primary IPv6 defense**
* Country limits are a **last-resort pressure valve**
* ASN limits are **classification-based**, not population-based
* Endpoint limits must apply to both identity and subnet

Add a short usage example as a comment at the bottom of the file.

