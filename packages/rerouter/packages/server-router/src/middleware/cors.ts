import {HttpStatus} from '@mpen/http-helpers'
import type {
    AnyContext,
    HandlerBody,
    HandlerResult,
    HandlerYield,
    MaybePromise,
    Middleware,
    OneOrMany,
    RequestContext,
} from '../types'

type CorsOriginResolver<Ctx extends object> =
    (origin: string | null, ctx: RequestContext<Ctx>) => MaybePromise<string | null | undefined | false>

type CorsMethodsResolver<Ctx extends object> =
    (origin: string | null, ctx: RequestContext<Ctx>) => MaybePromise<OneOrMany<string>>

type AllowedOriginEntry =
    | {kind: 'origin'; value: string}
    | {kind: 'host'; value: string}
    | {kind: 'regex'; value: RegExp}
    | {kind: 'null'}

export interface CorsOptions<Ctx extends object = AnyContext> {
    /**
     * Allowed origin(s) for cross-origin requests.
     */
    origin?: OneOrMany<string | URL | RegExp> | CorsOriginResolver<Ctx>
    /**
     * Allowed methods to echo in preflight responses.
     */
    allowMethods?: OneOrMany<string> | CorsMethodsResolver<Ctx>
    /**
     * Allowed headers to echo in preflight responses.
     */
    allowHeaders?: OneOrMany<string>
    /**
     * Response headers that should be exposed to the browser.
     */
    exposeHeaders?: OneOrMany<string>
    /**
     * Max age (seconds) for caching preflight responses.
     */
    maxAge?: number
    /**
     * Whether to set Access-Control-Allow-Credentials.
     */
    credentials?: boolean
    /**
     * Allow localhost and loopback origins for local development.
     */
    allowLocalhost?: boolean
    /**
     * Convenience flag that enables localhost allowances.
     */
    dev?: boolean
    /**
     * HTTP status to use for preflight responses.
     */
    preflightStatus?: number
}

const headerOrigin = 'origin'
const headerVary = 'vary'
const headerAccessControlRequestMethod = 'access-control-request-method'
const headerAccessControlRequestHeaders = 'access-control-request-headers'
const headerAllowOrigin = 'access-control-allow-origin'
const headerAllowMethods = 'access-control-allow-methods'
const headerAllowHeaders = 'access-control-allow-headers'
const headerAllowCredentials = 'access-control-allow-credentials'
const headerExposeHeaders = 'access-control-expose-headers'
const headerMaxAge = 'access-control-max-age'

const defaultAllowedMethods = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH']

function normalizeHeaderValue(value: string | null): string | null {
    if (!value) return null
    const trimmed = value.trim()
    return trimmed ? trimmed : null
}

function normalizeOriginHeader(value: string | null): string | null {
    return normalizeHeaderValue(value)
}

function parseOrigin(originHeader: string | null): URL | null {
    if (!originHeader || originHeader === 'null') return null
    try {
        return new URL(originHeader)
    } catch {
        return null
    }
}

function normalizeList(value?: OneOrMany<string>): string[] {
    if (!value) return []
    const list = Array.isArray(value) ? value : [value]
    return list.map(entry => entry.trim()).filter(Boolean)
}

function normalizeMethods(value?: OneOrMany<string>): string[] {
    return normalizeList(value).map(entry => entry.toUpperCase())
}

function formatHeaderList(value?: OneOrMany<string>): string | null {
    const list = normalizeList(value)
    if (!list.length) return null
    return list.join(', ')
}

function formatMethodList(value?: OneOrMany<string>): string | null {
    const list = normalizeMethods(value)
    if (!list.length) return null
    return list.join(', ')
}

function normalizeAllowedOrigins(value?: OneOrMany<string | URL | RegExp>): AllowedOriginEntry[] {
    if (!value) return []
    const list = Array.isArray(value) ? value : [value]
    const normalized: AllowedOriginEntry[] = []
    for (const entry of list) {
        if (entry instanceof RegExp) {
            normalized.push({kind: 'regex', value: entry})
            continue
        }
        if (entry instanceof URL) {
            normalized.push({kind: 'origin', value: entry.origin})
            continue
        }
        const trimmed = entry.trim()
        if (!trimmed) continue
        if (trimmed === 'null') {
            normalized.push({kind: 'null'})
            continue
        }
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

function hasWildcardOrigin(value?: OneOrMany<string | URL | RegExp>): boolean {
    if (!value) return false
    if (!Array.isArray(value)) {
        return typeof value === 'string' && value.trim() === '*'
    }
    return value.some((entry) => typeof entry === 'string' && entry.trim() === '*')
}

function isLocalhost(hostname: string): boolean {
    const lower = hostname.toLowerCase()
    return lower === 'localhost' || lower === '127.0.0.1' || lower === '::1' || lower === '0.0.0.0'
}

function isOriginAllowed(
    originHeader: string | null,
    originUrl: URL | null,
    allowlist: AllowedOriginEntry[],
    allowLocalhost: boolean
): boolean {
    if (!originHeader) return false
    if (originHeader === 'null') {
        return allowlist.some((entry) => entry.kind === 'null')
    }
    if (originUrl && allowLocalhost && isLocalhost(originUrl.hostname)) return true
    for (const entry of allowlist) {
        if (entry.kind === 'regex') {
            if (entry.value.test(originHeader)) return true
            continue
        }
        if (!originUrl) continue
        if (entry.kind === 'origin') {
            if (originUrl.origin === entry.value) return true
            continue
        }
        if (entry.kind === 'host') {
            if (entry.value.includes(':')) {
                if (originUrl.host === entry.value) return true
            } else if (originUrl.hostname === entry.value) {
                return true
            }
        }
    }
    return false
}

function addVaryHeader(headers: Headers, value: string): void {
    const current = headers.get(headerVary)
    if (!current) {
        headers.set(headerVary, value)
        return
    }
    const existing = current.split(',').map((entry) => entry.trim().toLowerCase())
    if (existing.includes(value.toLowerCase())) return
    headers.set(headerVary, `${current}, ${value}`)
}

function applyCorsHeaders(
    headers: Headers,
    allowOrigin: string,
    allowCredentials: boolean,
    exposeHeaders?: OneOrMany<string>,
    varyOrigin?: boolean
): void {
    headers.set(headerAllowOrigin, allowOrigin)
    if (allowCredentials) {
        headers.set(headerAllowCredentials, 'true')
    }
    const expose = formatHeaderList(exposeHeaders)
    if (expose) {
        headers.set(headerExposeHeaders, expose)
    }
    if (varyOrigin) {
        addVaryHeader(headers, 'Origin')
    }
}

function isBodyChunk(value: unknown): value is Uint8Array | string {
    return typeof value === 'string' || value instanceof Uint8Array
}

function isAsyncGenerator(value: unknown): value is AsyncGenerator<HandlerYield, HandlerBody> {
    return !!value && typeof (value as AsyncGenerator<HandlerYield, HandlerBody>)[Symbol.asyncIterator] === 'function'
}

function wrapGeneratorWithCors(
    generator: AsyncGenerator<HandlerYield, HandlerBody>,
    allowOrigin: string,
    allowCredentials: boolean,
    exposeHeaders: OneOrMany<string> | undefined,
    varyOrigin: boolean
): AsyncGenerator<HandlerYield, HandlerBody> {
    const apply = (headers: Headers) => {
        applyCorsHeaders(headers, allowOrigin, allowCredentials, exposeHeaders, varyOrigin)
    }

    async function* wrapped(): AsyncGenerator<HandlerYield, HandlerBody> {
        let headersInjected = false
        while (true) {
            const next = await generator.next()
            if (next.done) {
                if (!headersInjected) {
                    const headers = new Headers()
                    apply(headers)
                    yield headers
                }
                return next.value
            }
            const value = next.value
            if (value instanceof Headers) {
                const headers = new Headers(value)
                apply(headers)
                headersInjected = true
                yield headers
                continue
            }
            if (value && typeof value === 'object' && 'headers' in value) {
                const entry = value as {status?: number; headers?: HeadersInit}
                const headers = new Headers(entry.headers)
                apply(headers)
                headersInjected = true
                yield {...entry, headers}
                continue
            }
            if (!headersInjected && isBodyChunk(value)) {
                const headers = new Headers()
                apply(headers)
                headersInjected = true
                yield headers
            }
            yield value
        }
    }

    return wrapped()
}

/**
 * Attach CORS response headers and handle OPTIONS preflight requests.
 *
 * @example
 * ```ts
 * router.use(cors())
 * router.use(cors({origin: ['https://app.example.com'], credentials: true}))
 * router.use(cors({dev: true}))
 * ```
 *
 * @param options - Configuration for origin, preflight, and header behavior.
 * @returns Middleware that applies CORS headers to matching requests.
 */
export function cors<Ctx extends object = AnyContext>(
    options: CorsOptions<Ctx> = {}
): Middleware<Ctx> {
    const allowCredentials = options.credentials ?? false
    const allowLocalhost = options.allowLocalhost ?? options.dev ?? false
    const originOption = options.origin ?? '*'
    const originResolver = typeof originOption === 'function'
        ? originOption
        : undefined
    const originList = originResolver ? undefined : originOption as OneOrMany<string | URL | RegExp>
    const allowlist = originList ? normalizeAllowedOrigins(originList) : []
    const hasWildcard = originList ? hasWildcardOrigin(originList) : false
    const preflightStatus = options.preflightStatus ?? HttpStatus.NO_CONTENT

    return async (ctx, next) => {
        const originHeader = normalizeOriginHeader(ctx.req.headers.get(headerOrigin))
        const originUrl = parseOrigin(originHeader)

        let allowOrigin: string | null = null
        let varyOrigin = false

        if (originResolver) {
            const resolved = await originResolver(originHeader, ctx)
            if (resolved) {
                const normalized = String(resolved).trim()
                if (normalized === '*') {
                    if (allowCredentials && originHeader) {
                        allowOrigin = originUrl?.origin ?? originHeader
                        varyOrigin = true
                    } else if (!allowCredentials) {
                        allowOrigin = '*'
                    }
                } else if (normalized) {
                    allowOrigin = normalized
                    varyOrigin = Boolean(originHeader)
                }
            }
        } else if (hasWildcard) {
            if (allowCredentials && originHeader) {
                allowOrigin = originUrl?.origin ?? originHeader
                varyOrigin = true
            } else if (!allowCredentials) {
                allowOrigin = '*'
            }
        } else if (originHeader && isOriginAllowed(originHeader, originUrl, allowlist, allowLocalhost)) {
            allowOrigin = originUrl?.origin ?? originHeader
            varyOrigin = true
        }

        const isPreflight = ctx.req.method.toUpperCase() === 'OPTIONS'
            && ctx.req.headers.has(headerAccessControlRequestMethod)

        if (isPreflight) {
            if (!allowOrigin) {
                return new Response(null, {status: preflightStatus})
            }
            const headers = new Headers()
            applyCorsHeaders(headers, allowOrigin, allowCredentials, undefined, varyOrigin)

            const allowMethods = typeof options.allowMethods === 'function'
                ? await options.allowMethods(originHeader, ctx)
                : options.allowMethods ?? defaultAllowedMethods
            const allowMethodsValue = formatMethodList(allowMethods)
            if (allowMethodsValue) {
                headers.set(headerAllowMethods, allowMethodsValue)
            }

            const requestHeaders = normalizeHeaderValue(ctx.req.headers.get(headerAccessControlRequestHeaders))
            const allowHeadersValue = formatHeaderList(options.allowHeaders ?? requestHeaders ?? undefined)
            if (allowHeadersValue) {
                headers.set(headerAllowHeaders, allowHeadersValue)
            }

            if (options.maxAge != null) {
                headers.set(headerMaxAge, String(options.maxAge))
            }
            return new Response(null, {status: preflightStatus, headers})
        }

        const result = await next()
        if (!allowOrigin) return result

        if (result instanceof Response) {
            applyCorsHeaders(result.headers, allowOrigin, allowCredentials, options.exposeHeaders, varyOrigin)
            return result
        }

        if (isAsyncGenerator(result)) {
            return wrapGeneratorWithCors(result, allowOrigin, allowCredentials, options.exposeHeaders, varyOrigin)
        }

        if (isBodyChunk(result) || result instanceof ReadableStream) {
            const headers = new Headers()
            applyCorsHeaders(headers, allowOrigin, allowCredentials, options.exposeHeaders, varyOrigin)
            return new Response(result as BodyInit, {headers})
        }

        return result
    }
}
