import type {AnyContext, ContextMiddleware, HandlerBody, HandlerYield, OneOrMany, RequestContext} from '../types'
import {toArray} from '@mpen/server-router/lib/collections'

declare global {
    var _reloadCounter: number
}

globalThis._reloadCounter = globalThis._reloadCounter == null ? 0 : globalThis._reloadCounter+1

interface ExtraContext {
    prefix: string
    /**
     * Number of times this server has been hot-reloaded.
     */
    hotReloadCounter: number
    /**
     * Sequential request number.
     */
    requestCounter: number
}

export interface RequestIdCtxOptions<Ctx extends object = AnyContext> {
    /**
     * Prefix used by the default generator. Defaults to "req".
     */
    prefix?: string
    /**
     * Header(s) to check for a request id. Defaults to "x-request-id".
     * Set to null or empty array to disable.
     */
    readHeaderName?: OneOrMany<string>
    /**
     * Response header name to write the request id into.
     */
    writeHeaderName?: string
    /**
     * Custom request id generator used when no read header is present.
     * Receives the request context along with prefix and counter metadata.
     */
    generate?: (ctx: RequestContext<Ctx & {requestId?: string}>, xtra: ExtraContext) => string
}

function isBodyChunk(value: unknown): value is Uint8Array | string {
    return typeof value === 'string' || value instanceof Uint8Array
}

function isAsyncGenerator(value: unknown): value is AsyncGenerator<HandlerYield, HandlerBody> {
    return !!value && typeof (value as AsyncGenerator<HandlerYield, HandlerBody>)[Symbol.asyncIterator] === 'function'
}

function wrapGeneratorWithRequestId(
    generator: AsyncGenerator<HandlerYield, HandlerBody>,
    headerName: string,
    requestId: string
): AsyncGenerator<HandlerYield, HandlerBody> {
    const apply = (headers: Headers) => {
        headers.set(headerName, requestId)
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
 * Attach a request id to the context and optionally mirror it in the response headers.
 *
 * @example
 * ```ts
 * router.use(requestIdCtx({
 *   readHeaderName: ['x-request-id', 'x-trace-id'],
 *   writeHeaderName: 'x-request-id',
 *   generate: () => crypto.randomUUID(),
 * }))
 * ```
 *
 * @param options - Configuration for reading, generating, and writing request ids.
 * @returns Middleware that populates `requestId` on the context.
 */
export function requestIdCtx<Ctx extends object = AnyContext>(
    options: RequestIdCtxOptions<Ctx> = {}
): ContextMiddleware<{ requestId: string }> {
    const prefix = options.prefix ?? 'req'
    const headers = options.readHeaderName === undefined
        ? ['x-request-id', 'x-trace-id', 'traceparent']
        : (options.readHeaderName ? toArray(options.readHeaderName) : [])

    let requestCounter = 0
    const hotReloadCounter = globalThis._reloadCounter
    const generate = (ctx: RequestContext<Ctx & {requestId?: string}>) => {
        const extra: ExtraContext = {
            prefix,
            hotReloadCounter,
            requestCounter: ++requestCounter,
        }
        if (options.generate) return options.generate(ctx, extra)
        return `${extra.prefix}.${extra.hotReloadCounter}.${extra.requestCounter}`
    }

    if (!options.writeHeaderName) {
        return ctx => {
            let headerId: string | null = null

            for (const name of headers) {
                headerId = ctx.req.headers.get(name)
                if (headerId !== null) break
            }

            ctx.requestId = headerId ?? generate(ctx)
        }
    }

    const writeHeaderName = options.writeHeaderName

    return async (ctx, next) => {
        let headerId: string | null = null

        for (const name of headers) {
            headerId = ctx.req.headers.get(name)
            if (headerId !== null) break
        }

        const requestId = headerId ?? generate(ctx)
        ctx.requestId = requestId
        ctx.logger?.set('request_id', requestId)

        const result = await next()
        if (result instanceof Response) {
            result.headers.set(writeHeaderName, requestId)
            return result
        }

        if (isAsyncGenerator(result)) {
            return wrapGeneratorWithRequestId(result, writeHeaderName, requestId)
        }

        if (isBodyChunk(result) || result instanceof ReadableStream) {
            const headers = new Headers()
            headers.set(writeHeaderName, requestId)
            return new Response(result as BodyInit, {headers})
        }

        return result
    }
}
