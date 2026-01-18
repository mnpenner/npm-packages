import {HttpStatus} from '@mpen/http-helpers'
import {simpleStatus} from '@mpen/server-router/response/simple'
import type {AnyContext, HandlerResult, Middleware, RequestContext} from '../types'

type MaxContentSizeHandler<Ctx extends object = AnyContext> =
    (ctx: RequestContext<Ctx>) => HandlerResult | Promise<HandlerResult>

export interface MaxContentSizeOptions<Ctx extends object = AnyContext> {
    maxSize: number
    tooLarge?: MaxContentSizeHandler<Ctx>
    sizeMismatch?: MaxContentSizeHandler<Ctx>
}

class PayloadTooLargeError extends Error {
    readonly maxSize: number
    readonly received: number

    constructor(maxSize: number, received: number) {
        super(`Payload exceeded ${maxSize} bytes`)
        this.name = 'PayloadTooLargeError'
        this.maxSize = maxSize
        this.received = received
    }
}

class ContentLengthMismatchError extends Error {
    readonly expected: number
    readonly received: number

    constructor(expected: number, received: number) {
        super(`Content-Length ${expected} bytes did not match ${received} bytes`)
        this.name = 'ContentLengthMismatchError'
        this.expected = expected
        this.received = received
    }
}

const utf8encoder = new TextEncoder()

function parseContentLength(value: string | null): number | null {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) return null
    return parsed
}

function chunkByteLength(chunk: Uint8Array | string): number {
    if (typeof chunk === 'string') return utf8encoder.encode(chunk).length
    return chunk.byteLength
}

/**
 * Enforce a maximum request body size while preserving access to the incoming stream.
 *
 * @example
 * ```ts
 * router.use(maxContentSize({maxSize: 1024 * 1024}))
 * ```
 *
 * @param options - Configuration for max size enforcement and error handlers.
 * @returns Middleware that rejects oversized bodies and mismatched Content-Length values.
 */
export function maxContentSize<Ctx extends object = AnyContext>(
    options: MaxContentSizeOptions<Ctx>
): Middleware<Ctx> {
    const tooLargeHandler = options.tooLarge
        ?? (() => simpleStatus(HttpStatus.PAYLOAD_TOO_LARGE))
    const sizeMismatchHandler = options.sizeMismatch
        ?? (() => simpleStatus(HttpStatus.BAD_REQUEST))

    return async (ctx, next) => {
        const maxSize = options.maxSize
        const contentLength = parseContentLength(ctx.req.headers.get('content-length'))

        if (contentLength != null && contentLength > maxSize) {
            void ctx.req.body?.cancel()
            return await Promise.resolve(tooLargeHandler(ctx))
        }

        if (!ctx.req.body) {
            if (contentLength != null && contentLength !== 0) {
                return await Promise.resolve(sizeMismatchHandler(ctx))
            }
            return await next()
        }

        const reader = ctx.req.body.getReader()
        let bytesRead = 0

        const monitoredBody = new ReadableStream<Uint8Array>({
            async pull(controller) {
                const result = await reader.read()
                if (result.done) {
                    if (contentLength != null && bytesRead !== contentLength) {
                        controller.error(new ContentLengthMismatchError(contentLength, bytesRead))
                        return
                    }
                    controller.close()
                    return
                }

                const value = result.value
                bytesRead += chunkByteLength(value)
                if (bytesRead > maxSize) {
                    await reader.cancel()
                    controller.error(new PayloadTooLargeError(maxSize, bytesRead))
                    return
                }
                controller.enqueue(value)
            },
            cancel(reason) {
                return reader.cancel(reason)
            },
        })

        ctx.req = new Request(ctx.req.url, {
            method: ctx.req.method,
            headers: ctx.req.headers,
            signal: ctx.req.signal,
            body: monitoredBody,
        })

        try {
            return await next()
        } catch (err) {
            if (err instanceof PayloadTooLargeError) {
                return await Promise.resolve(tooLargeHandler(ctx))
            }
            if (err instanceof ContentLengthMismatchError) {
                return await Promise.resolve(sizeMismatchHandler(ctx))
            }
            throw err
        }
    }
}
