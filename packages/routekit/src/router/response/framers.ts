import { CommonHeaders } from '@mpen/http'
import type { RouterHeadersInit } from '../fetch-types'

type MaybePromise<T> = T | Promise<T>
type BodyChunk = string | Uint8Array | Buffer

/**
 * Framer used by streaming generators to encode structured chunks.
 *
 * @example
 * ```ts
 * yield stream(sseFramer())
 * yield chunk({event: 'ready'})
 * ```
 */
export interface StreamFramer<T = unknown> {
    /**
     * Content type for the stream.
     */
    contentType: string
    /**
     * Headers to add when this stream starts.
     */
    headers?: RouterHeadersInit
    /**
     * Return `true` when this framer can encode the provided chunk.
     *
     * @param value - Stream chunk to inspect.
     * @returns Whether `value` can be framed.
     */
    canFrame?: (value: unknown) => value is T
    /**
     * Encode one logical stream chunk.
     *
     * @param value - Stream chunk to encode.
     * @returns Encoded stream bytes or text.
     */
    frame(value: T): MaybePromise<BodyChunk>
    /**
     * Optional final stream bytes emitted when the generator completes.
     *
     * @returns Encoded closing bytes or text.
     */
    close?(): MaybePromise<BodyChunk | undefined>
}

/**
 * Create an SSE stream framer.
 *
 * @example
 * ```ts
 * yield stream(sseFramer())
 * yield chunk({event: 'ready'})
 * ```
 *
 * @returns Stream framer for `text/event-stream`.
 */
export function sseFramer(): StreamFramer<unknown> {
    return {
        contentType: 'text/event-stream; charset=utf-8',
        headers: {
            [CommonHeaders.CACHE_CONTROL]: 'no-cache',
            [CommonHeaders.CONNECTION]: 'keep-alive',
        },
        frame: (value) => `data: ${JSON.stringify(value) ?? 'null'}\n\n`,
    }
}

/**
 * Create a JSON Lines stream framer.
 *
 * @example
 * ```ts
 * yield stream(jsonLinesFramer())
 * yield chunk({event: 'ready'})
 * ```
 *
 * @returns Stream framer for `application/jsonl`.
 */
export function jsonLinesFramer(): StreamFramer<unknown> {
    return {
        contentType: 'application/jsonl; charset=utf-8',
        frame: (value) => `${JSON.stringify(value) ?? 'null'}\n`,
    }
}
