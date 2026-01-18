import {HttpStatus} from '@mpen/http-helpers'
import {simpleStatus} from '../response/simple'
import type {AnyContext, HandlerResult, MaybePromise, Middleware, OneOrMany, RequestContext} from '../types'

type CsrfHandler<Ctx extends object = AnyContext> =
    (ctx: RequestContext<Ctx>) => MaybePromise<HandlerResult>

type AllowedOriginEntry =
    | {kind: 'origin'; value: string}
    | {kind: 'host'; value: string}

export interface CsrfOptions<Ctx extends object = AnyContext> {
    /**
     * Origins that are allowed even when they are cross-site.
     * Values may be full origins (`https://app.example.com`) or bare hosts (`app.example.com`).
     */
    allowedOrigins?: OneOrMany<string | URL>
    /**
     * Allow localhost and loopback origins for local development.
     */
    allowLocalhost?: boolean
    /**
     * Allow requests without the Origin header (useful for curl).
     */
    allowMissingOrigin?: boolean
    /**
     * Allow requests without Sec-Fetch-* headers (useful for curl).
     */
    allowMissingFetchMetadata?: boolean
    /**
     * Convenience flag that enables localhost + missing header allowances.
     */
    dev?: boolean
    /**
     * Customize the rejection response.
     */
    reject?: CsrfHandler<Ctx>
}

const fetchDestHeader = 'sec-fetch-dest'
const fetchModeHeader = 'sec-fetch-mode'
const fetchSiteHeader = 'sec-fetch-site'

function parseOrigin(originHeader: string | null): URL | null {
    if (!originHeader) return null
    const trimmed = originHeader.trim()
    if (!trimmed || trimmed === 'null') return null
    try {
        return new URL(trimmed)
    } catch {
        return null
    }
}

function normalizeAllowedOrigins(allowed?: OneOrMany<string | URL>): AllowedOriginEntry[] {
    if (!allowed) return []
    const entries = Array.isArray(allowed) ? allowed : [allowed]
    const normalized: AllowedOriginEntry[] = []
    for (const entry of entries) {
        if (entry instanceof URL) {
            normalized.push({kind: 'origin', value: entry.origin})
            continue
        }
        const trimmed = entry.trim()
        if (!trimmed) continue
        if (trimmed.includes('://')) {
            try {
                normalized.push({kind: 'origin', value: new URL(trimmed).origin})
            } catch {
                continue
            }
        } else {
            normalized.push({kind: 'host', value: trimmed.replace(/\/+$/, '')})
        }
    }
    return normalized
}

function isOriginAllowlisted(origin: URL, allowlist: AllowedOriginEntry[]): boolean {
    for (const entry of allowlist) {
        if (entry.kind === 'origin') {
            if (origin.origin === entry.value) return true
            continue
        }
        if (entry.value.includes(':')) {
            if (origin.host === entry.value) return true
        } else if (origin.hostname === entry.value) {
            return true
        }
    }
    return false
}

function isLocalhost(hostname: string): boolean {
    const lower = hostname.toLowerCase()
    return lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '0.0.0.0'
}

function isIpAddress(hostname: string): boolean {
    if (hostname.includes(':')) return true
    return /^[0-9.]+$/.test(hostname)
}

function siteBase(hostname: string): string {
    const lower = hostname.toLowerCase()
    if (lower === 'localhost' || isIpAddress(lower)) return lower
    const parts = lower.split('.').filter(Boolean)
    if (parts.length <= 2) return lower
    return parts.slice(-2).join('.')
}

function isSameSite(origin: URL, requestUrl: URL): boolean {
    return siteBase(origin.hostname) === siteBase(requestUrl.hostname)
}

/**
 * Enforce CSRF protection using Fetch Metadata and Origin headers.
 *
 * By default, only same-site fetch() requests are allowed. Set `allowedOrigins` to permit
 * explicit cross-site origins. Enable `dev` to allow localhost and curl-style requests
 * that omit Fetch Metadata or Origin headers.
 *
 * @example
 * ```ts
 * router.use(csrf())
 * router.use(csrf({allowedOrigins: ['https://app.example.com']}))
 * router.use(csrf({dev: true}))
 * ```
 *
 * @param options - Configuration for allowed origins and dev-friendly relaxations.
 * @returns Middleware that rejects requests failing CSRF checks.
 */
export function csrf<Ctx extends object = AnyContext>(
    options: CsrfOptions<Ctx> = {}
): Middleware<Ctx> {
    const reject = options.reject ?? (() => simpleStatus(HttpStatus.FORBIDDEN))
    const allowLocalhost = options.allowLocalhost ?? options.dev ?? false
    const allowMissingOrigin = options.allowMissingOrigin ?? options.dev ?? false
    const allowMissingFetchMetadata = options.allowMissingFetchMetadata ?? options.dev ?? false
    const allowedOrigins = normalizeAllowedOrigins(options.allowedOrigins)

    return async (ctx, next) => {
        const requestUrl = new URL(ctx.req.url)
        const originHeader = ctx.req.headers.get('origin')
        const originUrl = parseOrigin(originHeader)

        const fetchDest = ctx.req.headers.get(fetchDestHeader)
        const fetchMode = ctx.req.headers.get(fetchModeHeader)
        const fetchSite = ctx.req.headers.get(fetchSiteHeader)

        const fetchMetadataMissing = !fetchDest || !fetchMode || !fetchSite
        if (fetchMetadataMissing && !allowMissingFetchMetadata) {
            return await Promise.resolve(reject(ctx))
        }

        if (fetchDest && fetchDest !== 'empty') {
            return await Promise.resolve(reject(ctx))
        }
        if (fetchMode && fetchMode !== 'cors' && fetchMode !== 'same-origin') {
            return await Promise.resolve(reject(ctx))
        }

        const originIsAllowlisted = originUrl ? isOriginAllowlisted(originUrl, allowedOrigins) : false
        const originIsLocalhost = originUrl ? (allowLocalhost && isLocalhost(originUrl.hostname)) : false
        const originIsSameSite = originUrl ? isSameSite(originUrl, requestUrl) : false

        if (!originUrl && !allowMissingOrigin) {
            return await Promise.resolve(reject(ctx))
        }
        if (originUrl && !(originIsAllowlisted || originIsLocalhost || originIsSameSite)) {
            return await Promise.resolve(reject(ctx))
        }

        if (fetchSite) {
            if (fetchSite === 'same-origin' || fetchSite === 'same-site') {
                // ok
            } else if (fetchSite === 'cross-site') {
                if (!originIsAllowlisted && !originIsLocalhost) {
                    return await Promise.resolve(reject(ctx))
                }
            } else {
                return await Promise.resolve(reject(ctx))
            }
        }

        return await next()
    }
}
