import {HttpMethod, HttpStatus} from '@mpen/http-helpers'
import {simpleStatus} from '@mpen/server-router/response/simple'
import type {AnyContext, Middleware, RequestContext} from '../types'

export interface RateBucket {
    windowMs: number
    scale: number
}

export interface AsnRecord {
    asn: number
    organization: string
}

export interface RateLimitIdentityInput {
    userId: string | number | null | undefined
    ipAddress: string
}

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
        input: RateLimitIdentityInput
    ): Promise<AsnRecord | null>

    getCountryCode?(
        ctx: C,
        input: RateLimitIdentityInput
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
            ipv4Prefix?: number   // default 24
            ipv6Prefix?: number   // default 64
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

type EndpointMatcher = {
    pattern: URLPattern
    limit: MethodLimit
}

type SubnetInfo = {
    key: string
    version: 'ipv4' | 'ipv6' | 'unknown'
}

type GeoResolvers<C> = {
    getAsn: (ctx: C, input: RateLimitIdentityInput) => Promise<AsnRecord | null>
    getCountry: (ctx: C, input: RateLimitIdentityInput) => Promise<string | null>
}

type MaxmindModule = {
    open: (path: string) => Promise<{get: (ip: string) => any}>
}

const DEFAULT_MAX_ENTRIES = 100_000

const ASN_OVERRIDES: Record<number, AsnClass> = {
    // Cloud hyperscalers
    16509: 'cloud',     // AWS
    14618: 'cloud',     // Amazon.com (enterprise)
    15169: 'cloud',     // Google
    8075:  'cloud',     // Microsoft Azure
    31898: 'cloud',     // Oracle Cloud
    45102: 'cloud',     // Alibaba Cloud
    132203: 'cloud',    // Tencent Cloud
    36351: 'cloud',     // IBM Cloud

    // CDN
    13335: 'cdn',       // Cloudflare
    54113: 'cdn',       // Fastly
    20940: 'cdn',       // Akamai

    // Other cloud/hosting
    14061: 'cloud',     // DigitalOcean
    20473: 'cloud',     // Vultr
    63949: 'cloud',     // Linode (Akamai)
    24940: 'hosting',   // Hetzner
    16276: 'hosting',   // OVHcloud
    12876: 'hosting',   // Scaleway
    8560:  'hosting',   // IONOS
    47583: 'hosting',   // Hostinger
    22612: 'hosting',   // Namecheap
}

const KEYWORDS: Record<Extract<AsnClass, string>, string[]> = {
    cdn: ['cloudflare', 'fastly', 'akamai', 'cdn'],
    cloud: [
        'amazon', 'aws',
        'google', 'gcp',
        'microsoft', 'azure',
        'oracle', 'alibaba',
        'tencent', 'digitalocean',
        'vultr', 'linode', 'ibm'
    ],
    hosting: [
        'hosting', 'host', 'colo',
        'datacenter', 'data center',
        'ovh', 'scaleway', 'ionos',
        'hostinger', 'namecheap'
    ],
    mobile: ['mobile', 'wireless', 'cellular', 'lte', '5g'],
    residential: ['telecom', 'broadband', 'cable', 'fiber'],
    unknown: [],
}

class InMemoryRateLimitStorage<C> implements RateLimitStorage<C> {
    private readonly maxEntries: number
    private readonly store = new Map<string, {counter: FixedWindowCounter; expiresAtMs: number}>()

    constructor(maxEntries: number) {
        this.maxEntries = maxEntries
    }

    async readCounter(_ctx: C, key: string): Promise<FixedWindowCounter | null> {
        const entry = this.store.get(key)
        if (!entry) return null
        if (entry.expiresAtMs <= Date.now()) {
            this.store.delete(key)
            return null
        }
        this.store.delete(key)
        this.store.set(key, entry)
        return entry.counter
    }

    async writeCounter(_ctx: C, key: string, counter: FixedWindowCounter, ttlMs: number): Promise<void> {
        const expiresAtMs = Date.now() + ttlMs
        if (this.store.has(key)) this.store.delete(key)
        this.store.set(key, {counter, expiresAtMs})
        this.evictIfNeeded()
    }

    private evictIfNeeded() {
        while (this.store.size > this.maxEntries) {
            const firstKey = this.store.keys().next().value
            if (!firstKey) return
            this.store.delete(firstKey)
        }
    }
}

function defaultGetIpAddress<Ctx extends object = AnyContext>(ctx: RequestContext<Ctx>): Promise<string> {
    const forwardedFor = ctx.req.headers.get('x-forwarded-for')
    if (forwardedFor) {
        const first = forwardedFor.split(',')[0]?.trim()
        if (first) return Promise.resolve(cleanIpAddress(first))
    }
    const realIp = ctx.req.headers.get('x-real-ip')
    if (realIp) return Promise.resolve(cleanIpAddress(realIp.trim()))
    return Promise.resolve('unknown')
}

function cleanIpAddress(ip: string): string {
    let value = ip.trim()
    if (!value) return 'unknown'
    if (value.startsWith('[')) {
        const closing = value.indexOf(']')
        if (closing !== -1) value = value.slice(1, closing)
    }
    const zoneIndex = value.indexOf('%')
    if (zoneIndex !== -1) value = value.slice(0, zoneIndex)
    if (value.includes('.') && value.split(':').length === 2) {
        const segment = value.split(':')[0]
        if (!segment) return 'unknown'
        value = segment
    }
    return value
}

function normalizeQueryString(url: URL): string {
    const query = url.searchParams.toString()
    return query
}

function getBucketMax(baseMax: number, baseWindowMs: number, bucket: RateBucket): number {
    return Math.floor(baseMax * (bucket.windowMs / baseWindowMs) * bucket.scale)
}

function getBucketResetAt(nowMs: number, windowMs: number): number {
    return Math.floor(nowMs / windowMs) * windowMs + windowMs
}

async function applyFixedWindowLimit<C>(
    ctx: C,
    storage: RateLimitStorage<C>,
    key: string,
    windowMs: number,
    max: number,
    ttlMs: number,
    nowMs: number
): Promise<{allowed: boolean; resetAtMs: number}> {
    const stored = await storage.readCounter(ctx, key)
    const resetAtMs = getBucketResetAt(nowMs, windowMs)
    const counter =
        stored && stored.resetAtMs > nowMs
            ? stored
            : {resetAtMs, count: 0}
    const nextCount = counter.count + 1
    const updated: FixedWindowCounter = {resetAtMs: counter.resetAtMs, count: nextCount}
    await storage.writeCounter(ctx, key, updated, ttlMs)
    return {allowed: nextCount <= max, resetAtMs: counter.resetAtMs}
}

function toURLPattern(pattern: EndpointLimit['pattern']): URLPattern {
    const URLPatternCtor = ensureURLPattern()
    if (pattern instanceof URLPatternCtor) return pattern
    if (Array.isArray(pattern)) return new URLPatternCtor(...pattern)
    if (typeof pattern === 'string') {
        if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
            return new URLPatternCtor(pattern)
        }
        return new URLPatternCtor({pathname: pattern})
    }
    return new URLPatternCtor(pattern)
}

function resolveEndpointLimit(method: string, url: URL, matchers: EndpointMatcher[]): number | null {
    const normalizedMethod = method.toUpperCase()
    let minLimit: number | null = null
    for (const matcher of matchers) {
        if (!matcher.pattern.test(url)) continue
        const limit = matcher.limit
        const methodLimit =
            typeof limit === 'number'
                ? limit
                : limit[normalizedMethod as HttpMethod]
        if (methodLimit == null) continue
        minLimit = minLimit == null ? methodLimit : Math.min(minLimit, methodLimit)
    }
    return minLimit
}

function parseIpv4Address(ip: string): number[] | null {
    const parts = ip.split('.')
    if (parts.length !== 4) return null
    const bytes: number[] = []
    for (const part of parts) {
        if (!part) return null
        const value = Number(part)
        if (!Number.isInteger(value) || value < 0 || value > 255) return null
        bytes.push(value)
    }
    return bytes
}

function parseIpv6Hextets(ip: string): number[] | null {
    let value = ip.toLowerCase()
    const zoneIndex = value.indexOf('%')
    if (zoneIndex !== -1) value = value.slice(0, zoneIndex)

    const halves = value.split('::')
    if (halves.length > 2) return null

    const left = halves[0] ? halves[0].split(':') : []
    const right = halves.length === 2 && halves[1] ? halves[1].split(':') : []

    const leftParsed = parseIpv6Segments(left)
    if (!leftParsed) return null
    const rightParsed = parseIpv6Segments(right)
    if (!rightParsed) return null

    if (halves.length === 1) {
        if (leftParsed.length !== 8) return null
        return leftParsed
    }

    const missing = 8 - (leftParsed.length + rightParsed.length)
    if (missing < 0) return null
    return [...leftParsed, ...new Array<number>(missing).fill(0), ...rightParsed]
}

function parseIpv6Segments(parts: string[]): number[] | null {
    const hextets: number[] = []
    for (let index = 0; index < parts.length; index += 1) {
        const part = parts[index]
        if (!part) return null
        if (part.includes('.')) {
            if (index !== parts.length - 1) return null
            const bytes = parseIpv4Address(part)
            if (!bytes) return null
            if (bytes.length !== 4) return null
            const [b0, b1, b2, b3] = bytes
            if (b0 == null || b1 == null || b2 == null || b3 == null) return null
            hextets.push((b0 << 8) | b1, (b2 << 8) | b3)
            continue
        }
        const value = Number.parseInt(part, 16)
        if (!Number.isFinite(value) || value < 0 || value > 0xffff) return null
        hextets.push(value)
    }
    return hextets
}

function deriveSubnet(ipAddress: string, ipv4Prefix = 24, ipv6Prefix = 64): SubnetInfo {
    const ipv4 = parseIpv4Address(ipAddress)
    if (ipv4) {
        if (ipv4.length !== 4) {
            return {key: 'subnet:unknown', version: 'unknown'}
        }
        const [o1, o2, o3] = ipv4
        if (o1 == null || o2 == null || o3 == null) {
            return {key: 'subnet:unknown', version: 'unknown'}
        }
        if (!Number.isInteger(ipv4Prefix) || ipv4Prefix < 0 || ipv4Prefix > 32) {
            return {key: 'subnet:unknown', version: 'unknown'}
        }
        if (ipv4Prefix !== 24) {
            const ipInt = ((o1 << 24) | (o2 << 16) | (o3 << 8) | (ipv4[3] ?? 0)) >>> 0
            const mask = ipv4Prefix === 0 ? 0 : (0xffffffff << (32 - ipv4Prefix)) >>> 0
            const network = ipInt & mask
            const b0 = (network >>> 24) & 0xff
            const b1 = (network >>> 16) & 0xff
            const b2 = (network >>> 8) & 0xff
            const b3 = network & 0xff
            return {
                key: `ip4:${b0}.${b1}.${b2}.${b3}/${ipv4Prefix}`,
                version: 'ipv4',
            }
        }
        return {
            key: `ip24:${o1}.${o2}.${o3}.0/24`,
            version: 'ipv4',
        }
    }

    const ipv6 = parseIpv6Hextets(ipAddress)
    if (ipv6 && ipv6.length === 8) {
        const h1 = ipv6[0]!
        const h2 = ipv6[1]!
        const h3 = ipv6[2]!
        const h4 = ipv6[3]!
        if (!Number.isInteger(ipv6Prefix) || ipv6Prefix < 0 || ipv6Prefix > 128) {
            return {key: 'subnet:unknown', version: 'unknown'}
        }
        if (ipv6Prefix !== 64) {
            const masked = maskIpv6(ipv6, ipv6Prefix)
            const keyParts = masked.map((value) => value.toString(16))
            return {
                key: `ip6:${keyParts.join(':')}/${ipv6Prefix}`,
                version: 'ipv6',
            }
        }
        return {
            key: `ip64:${h1.toString(16)}:${h2.toString(16)}:${h3.toString(16)}:${h4.toString(16)}::/64`,
            version: 'ipv6',
        }
    }

    return {key: 'subnet:unknown', version: 'unknown'}
}

function maskIpv6(hextets: number[], prefix: number): number[] {
    const masked: number[] = []
    let remaining = prefix
    for (const hextet of hextets) {
        if (remaining >= 16) {
            masked.push(hextet)
            remaining -= 16
            continue
        }
        if (remaining <= 0) {
            masked.push(0)
            continue
        }
        const mask = ((0xffff << (16 - remaining)) & 0xffff) >>> 0
        masked.push(hextet & mask)
        remaining = 0
    }
    return masked
}

function defaultAsnToClass(asn: number, organization: string): AsnClass {
    const override = ASN_OVERRIDES[asn]
    if (override) return override
    const normalizedOrg = organization.toLowerCase()
    const entries = Object.entries(KEYWORDS) as Array<[string, string[]]>
    for (const [asnClass, keywords] of entries) {
        if (asnClass === 'unknown') continue
        if (keywords.some((keyword) => normalizedOrg.includes(keyword))) {
            return asnClass as AsnClass
        }
    }
    return 'unknown'
}

function normalizeAsnClass(asnClass: AsnClass | null | undefined): AsnClass {
    if (!asnClass) return 'unknown'
    return asnClass
}

function normalizeCountryCode(code: string | null | undefined): string | null {
    if (!code) return null
    const trimmed = code.trim()
    if (!trimmed) return null
    return trimmed.toUpperCase()
}

async function loadMaxmindModule(): Promise<MaxmindModule> {
    try {
        return await import('maxmind') as MaxmindModule
    } catch (err) {
        throw new Error('maxmind is required for ASN or country lookups; install it as a peer dependency', {cause: err as Error})
    }
}

function createGeoResolvers<C>(options: RateLimitOptions<C>): GeoResolvers<C> {
    let maxmindModulePromise: Promise<MaxmindModule> | null = null
    let asnReaderPromise: Promise<{get: (ip: string) => any} | null> | null = null
    let countryReaderPromise: Promise<{get: (ip: string) => any} | null> | null = null

    const loadMaxmind = () => {
        if (!maxmindModulePromise) {
            maxmindModulePromise = loadMaxmindModule()
        }
        return maxmindModulePromise
    }

    const loadAsnReader = async (): Promise<{get: (ip: string) => any} | null> => {
        if (!options.maxmindAsnDatabase) return null
        if (!asnReaderPromise) {
            asnReaderPromise = loadMaxmind().then((module) => module.open(options.maxmindAsnDatabase!))
        }
        return asnReaderPromise
    }

    const loadCountryReader = async (): Promise<{get: (ip: string) => any} | null> => {
        if (!options.maxmindCountryDatabase) return null
        if (!countryReaderPromise) {
            countryReaderPromise = loadMaxmind().then((module) => module.open(options.maxmindCountryDatabase!))
        }
        return countryReaderPromise
    }

    const getAsn = options.getAsn ?? (async (_ctx: C, input) => {
        const reader = await loadAsnReader()
        if (!reader) return null
        const record = reader.get(input.ipAddress)
        const asn = record?.autonomous_system_number ?? record?.autonomousSystemNumber
        const organization =
            record?.autonomous_system_organization
            ?? record?.autonomousSystemOrganization
            ?? record?.organization
        if (typeof asn !== 'number' || !organization) return null
        return {asn, organization: String(organization)}
    })

    const getCountry = options.getCountryCode ?? (async (_ctx: C, input) => {
        const reader = await loadCountryReader()
        if (!reader) return null
        const record = reader.get(input.ipAddress)
        const code = record?.country?.iso_code ?? record?.country?.isoCode
        return normalizeCountryCode(typeof code === 'string' ? code : null)
    })

    return {getAsn, getCountry}
}

function formatRetryAfterSeconds(resetAtMs: number, nowMs: number): string {
    const seconds = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000))
    return String(seconds)
}

function buildTooManyRequests(addRetryAfterHeader: boolean, resetAtMs: number, nowMs: number): Response {
    const response = simpleStatus(HttpStatus.TOO_MANY_REQUESTS)
    if (addRetryAfterHeader) {
        response.headers.set('Retry-After', formatRetryAfterSeconds(resetAtMs, nowMs))
    }
    return response
}

/**
 * Enforce per-identity, subnet, ASN, country, and endpoint rate limits using fixed-window buckets.
 *
 * @example
 * ```ts
 * router.use(rateLimit({
 *   getUserId: async ({user}) => user?.id,
 *   getGlobalPeakConcurrentUsers: async () => 5000,
 *   baseWindowMs: 60_000,
 *   baseMaxRequestsPerBaseWindow: 120,
 *   anonymousIpMultiplier: 0.5,
 *   addRetryAfterHeader: true,
 *   buckets: [{windowMs: 60_000, scale: 1}],
 *   endpointLimits: [{pattern: '/login', limit: {POST: 10}}],
 *   includeQueryInEndpointKey: false,
 *   scales: {subnet: {ipv4: 2, ipv6: 1}},
 * }))
 * ```
 *
 * @param options - Configuration for identity sources, buckets, scaling, and storage.
 * @returns Middleware that enforces rate limits and returns 429 responses when exceeded.
 */
export function rateLimit<Ctx extends object = AnyContext>(
    options: RateLimitOptions<RequestContext<Ctx>>
): Middleware<Ctx> {
    if (!options.buckets.length) {
        throw new Error('rateLimit requires at least one bucket')
    }

    const maxBucketWindowMs = Math.max(...options.buckets.map((bucket) => bucket.windowMs))
    const storageTtlMs = maxBucketWindowMs
    const inMemoryTtlMs = options.inMemory?.ttlMs ?? maxBucketWindowMs
    const storage = options.storage
        ?? new InMemoryRateLimitStorage<RequestContext<Ctx>>(options.inMemory?.maxEntries ?? DEFAULT_MAX_ENTRIES)
    const getIpAddress = options.getIpAddress ?? defaultGetIpAddress
    const normalizeQuery = options.normalizeQuery ?? normalizeQueryString
    const endpointMatchers = options.endpointLimits.map((limit) => ({
        pattern: toURLPattern(limit.pattern),
        limit: limit.limit,
    }))
    const asnToClass = options.asnToClass ?? defaultAsnToClass
    const geoResolvers = createGeoResolvers(options)

    let globalPeakPromise: Promise<number> | null = null

    const getGlobalPeakConcurrentUsers = (ctx: RequestContext<Ctx>) => {
        if (!globalPeakPromise) {
            globalPeakPromise = options.getGlobalPeakConcurrentUsers(ctx)
        }
        return globalPeakPromise
    }

    const asnLimitEnabled = Boolean(options.scales.asnClass && (options.getAsn || options.maxmindAsnDatabase))
    const countryLimitEnabled = Boolean(options.scales.country && (options.getCountryCode || options.maxmindCountryDatabase))
    const subnetAsnClassEnabled = Boolean(options.scales.subnet.byAsnClass && (options.getAsn || options.maxmindAsnDatabase))

    return async (ctx, next) => {
        const nowMs = (ctx as any).startTime ?? Date.now()
        const url = new URL(ctx.req.url)
        const method = ctx.req.method.toUpperCase()

        const userId = await options.getUserId(ctx)
        const ipAddress = cleanIpAddress(await getIpAddress(ctx))

        const identityKey = userId ? `identity:user:${userId}` : `identity:ip:${ipAddress}`
        const identityMultiplier = userId ? 1 : options.anonymousIpMultiplier

        const subnet = deriveSubnet(
            ipAddress,
            options.scales.subnet.ipv4Prefix ?? 24,
            options.scales.subnet.ipv6Prefix ?? 64
        )
        const subnetScaleBase = subnet.version === 'ipv6' ? options.scales.subnet.ipv6 : options.scales.subnet.ipv4
        let asnRecord: AsnRecord | null = null
        let asnClass: AsnClass = 'unknown'

        if (asnLimitEnabled || subnetAsnClassEnabled) {
            asnRecord = await geoResolvers.getAsn(ctx, {userId, ipAddress})
            asnClass = normalizeAsnClass(
                asnRecord ? asnToClass(asnRecord.asn, asnRecord.organization) : 'unknown'
            )
        }

        const subnetClassScale = options.scales.subnet.byAsnClass?.[asnClass] ?? 1
        const subnetMultiplier = subnetScaleBase * subnetClassScale

        let countryCode: string | null = null
        if (countryLimitEnabled) {
            countryCode = normalizeCountryCode(await geoResolvers.getCountry(ctx, {userId, ipAddress}))
        }

        const endpointBaseLimit = endpointMatchers.length
            ? resolveEndpointLimit(method, url, endpointMatchers)
            : null
        const endpointKeyBase = buildEndpointKeyBase(
            url,
            method,
            options.includeQueryInEndpointKey,
            normalizeQuery
        )
        const endpointIdentityKey = endpointKeyBase ? `${endpointKeyBase}:identity:${identityKey}` : null
        const endpointSubnetKey = endpointKeyBase ? `${endpointKeyBase}:subnet:${subnet.key}` : null

        const globalPeak = (asnLimitEnabled || countryLimitEnabled)
            ? await getGlobalPeakConcurrentUsers(ctx)
            : 1

        for (const bucket of options.buckets) {
            const bucketMax = getBucketMax(
                options.baseMaxRequestsPerBaseWindow,
                options.baseWindowMs,
                bucket
            )
            const bucketSuffix = `:w${bucket.windowMs}`

            const identityMax = Math.floor(bucketMax * identityMultiplier)
            const identityResult = await applyFixedWindowLimit(
                ctx,
                storage,
                `${identityKey}${bucketSuffix}`,
                bucket.windowMs,
                identityMax,
                options.storage ? storageTtlMs : inMemoryTtlMs,
                nowMs
            )
            if (!identityResult.allowed) {
                return buildTooManyRequests(options.addRetryAfterHeader, identityResult.resetAtMs, nowMs)
            }

            const subnetMax = Math.floor(bucketMax * subnetMultiplier)
            const subnetResult = await applyFixedWindowLimit(
                ctx,
                storage,
                `${subnet.key}${bucketSuffix}`,
                bucket.windowMs,
                subnetMax,
                options.storage ? storageTtlMs : inMemoryTtlMs,
                nowMs
            )
            if (!subnetResult.allowed) {
                return buildTooManyRequests(options.addRetryAfterHeader, subnetResult.resetAtMs, nowMs)
            }

            if (asnLimitEnabled && options.scales.asnClass) {
                const asnScale = options.scales.asnClass[asnClass] ?? options.scales.asnClass.unknown
                const asnMax = Math.floor(bucketMax * asnScale * globalPeak)
                const asnKey = asnRecord ? `asn:${asnRecord.asn}` : 'asn:unknown'
                const asnResult = await applyFixedWindowLimit(
                    ctx,
                    storage,
                    `${asnKey}${bucketSuffix}`,
                    bucket.windowMs,
                    asnMax,
                    options.storage ? storageTtlMs : inMemoryTtlMs,
                    nowMs
                )
                if (!asnResult.allowed) {
                    return buildTooManyRequests(options.addRetryAfterHeader, asnResult.resetAtMs, nowMs)
                }
            }

            if (countryLimitEnabled && options.scales.country) {
                const countryScale = countryCode
                    ? options.scales.country[countryCode] ?? options.scales.country.other
                    : options.scales.country.unknown
                const countryMax = Math.floor(bucketMax * countryScale * globalPeak)
                const countryKey = countryCode ? `country:${countryCode}` : 'country:unknown'
                const countryResult = await applyFixedWindowLimit(
                    ctx,
                    storage,
                    `${countryKey}${bucketSuffix}`,
                    bucket.windowMs,
                    countryMax,
                    options.storage ? storageTtlMs : inMemoryTtlMs,
                    nowMs
                )
                if (!countryResult.allowed) {
                    return buildTooManyRequests(options.addRetryAfterHeader, countryResult.resetAtMs, nowMs)
                }
            }

            if (endpointBaseLimit != null && endpointKeyBase && endpointIdentityKey && endpointSubnetKey) {
                const endpointBucketMax = getBucketMax(
                    endpointBaseLimit,
                    options.baseWindowMs,
                    bucket
                )
                const endpointIdentityMax = Math.floor(endpointBucketMax * identityMultiplier)
                const endpointSubnetMax = Math.floor(endpointBucketMax * subnetMultiplier)

                const endpointIdentityResult = await applyFixedWindowLimit(
                    ctx,
                    storage,
                    `${endpointIdentityKey}${bucketSuffix}`,
                    bucket.windowMs,
                    endpointIdentityMax,
                    options.storage ? storageTtlMs : inMemoryTtlMs,
                    nowMs
                )
                if (!endpointIdentityResult.allowed) {
                    return buildTooManyRequests(options.addRetryAfterHeader, endpointIdentityResult.resetAtMs, nowMs)
                }

                const endpointSubnetResult = await applyFixedWindowLimit(
                    ctx,
                    storage,
                    `${endpointSubnetKey}${bucketSuffix}`,
                    bucket.windowMs,
                    endpointSubnetMax,
                    options.storage ? storageTtlMs : inMemoryTtlMs,
                    nowMs
                )
                if (!endpointSubnetResult.allowed) {
                    return buildTooManyRequests(options.addRetryAfterHeader, endpointSubnetResult.resetAtMs, nowMs)
                }
            }
        }

        return await next()
    }
}

function buildEndpointKeyBase(
    url: URL,
    method: string,
    includeQuery: boolean,
    normalizeQuery: (url: URL) => string
): string | null {
    const pathname = url.pathname
    const normalizedMethod = method.toUpperCase()
    if (!includeQuery) {
        return `route:${normalizedMethod}:${pathname}`
    }
    const query = normalizeQuery(url)
    return `routeq:${normalizedMethod}:${pathname}?${query}`
}

function ensureURLPattern(): typeof URLPattern {
    if (typeof URLPattern === 'undefined') {
        throw new Error('URLPattern is not available in this runtime')
    }
    return URLPattern
}
