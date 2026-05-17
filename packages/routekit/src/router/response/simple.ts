import { CommonContentTypes, CommonHeaders, HttpStatus } from '@mpen/http'
import type { RouterBodyInit, RouterHeadersInit } from '../fetch-types'
import { fullWide } from '../lib/format'

type MaybePromise<T> = T | Promise<T>
type BodyChunk = string | Uint8Array | Buffer

const routekitResponseBrand: unique symbol = Symbol('RoutekitResponse')
const routekitDirectiveBrand: unique symbol = Symbol('RoutekitDirective')
const routekitBodyBrand: unique symbol = Symbol('RoutekitBody')

/**
 * Logical route result used by Routekit before it is finalized into a native [`Response`]{@link Response}.
 *
 * @example
 * ```ts
 * const result = ok({payload: 'ready'})
 * ```
 */
export interface RoutekitResponse<T = unknown> {
    readonly [routekitResponseBrand]: true
    /**
     * HTTP status code to use for the finalized response.
     */
    status: number | HttpStatus
    /**
     * Headers to include in the finalized response.
     */
    headers: Headers
    /**
     * Logical or represented response body.
     */
    body: T
}

/**
 * Options accepted by logical response helpers.
 */
export interface RoutekitResponseInit {
    /**
     * HTTP status code for the response. Defaults to `200`.
     */
    status?: number | HttpStatus
    /**
     * Headers to include in the finalized response.
     */
    headers?: RouterHeadersInit
}

/**
 * Serializer used by the router when a logical response has no explicit `Content-Type`.
 *
 * @example
 * ```ts
 * const json = jsonSerializer()
 * ```
 */
export interface BodySerializer<T = unknown> {
    /**
     * Media types this serializer can produce.
     */
    mediaTypes: readonly string[]
    /**
     * Return `true` when this serializer can encode the provided value.
     *
     * @param value - Logical response body to inspect.
     * @returns Whether `value` can be serialized by this serializer.
     */
    canSerialize(value: unknown): value is T
    /**
     * Encode a logical response body into a native Fetch response body.
     *
     * @param value - Logical response body to encode.
     * @returns Native response body data.
     */
    serialize(value: T): MaybePromise<RouterBodyInit | null>
}

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
 * Final body wrapper returned from a handler or generator.
 *
 * @example
 * ```ts
 * return body({payload: 'done'})
 * ```
 */
export interface RoutekitBody<T = unknown> {
    readonly [routekitBodyBrand]: true
    /**
     * Logical response body value.
     */
    value: T
}

interface BaseDirective {
    readonly [routekitDirectiveBrand]: true
}

/**
 * Generator directive that sets the response status.
 */
export interface StatusDirective extends BaseDirective {
    kind: 'status'
    status: number | HttpStatus
}

/**
 * Generator directive that merges response headers.
 */
export interface HeadersDirective extends BaseDirective {
    kind: 'headers'
    headers: Headers
}

/**
 * Generator directive that sets response status and merges response headers.
 */
export interface HeadDirective extends BaseDirective {
    kind: 'head'
    status: number | HttpStatus
    headers: Headers
}

/**
 * Generator directive that starts structured streaming with a framer.
 */
export interface StreamDirective<T = unknown> extends BaseDirective {
    kind: 'stream'
    framer: StreamFramer<T>
    headers: Headers
}

/**
 * Generator directive that emits one stream chunk.
 */
export interface ChunkDirective<T = unknown> extends BaseDirective {
    kind: 'chunk'
    value: T
}

/**
 * Values that generator-style handlers may yield.
 */
export type RoutekitYield =
    | StatusDirective
    | HeadersDirective
    | HeadDirective
    | StreamDirective
    | ChunkDirective
    | undefined

function hasContentType(headers: Headers): boolean {
    return headers.has(CommonHeaders.CONTENT_TYPE)
}

function isArrayBufferView(value: unknown): value is ArrayBufferView {
    return ArrayBuffer.isView(value)
}

/**
 * Test whether a value can be passed directly to the native [`Response`]{@link Response} constructor.
 *
 * @example
 * ```ts
 * isResponseBodyInit('ok')
 * ```
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a native response body.
 */
export function isResponseBodyInit(value: unknown): value is RouterBodyInit | null | undefined {
    return (
        value == null ||
        typeof value === 'string' ||
        value instanceof ReadableStream ||
        value instanceof Blob ||
        value instanceof FormData ||
        value instanceof URLSearchParams ||
        value instanceof ArrayBuffer ||
        isArrayBufferView(value)
    )
}

/**
 * Test whether a value is a Routekit logical response.
 *
 * @example
 * ```ts
 * if (isRoutekitResponse(result)) result.headers.set('x-request-id', id)
 * ```
 *
 * @param value - Value to inspect.
 * @returns Whether `value` was created by a Routekit response helper.
 */
export function isRoutekitResponse(value: unknown): value is RoutekitResponse {
    return !!value && (value as RoutekitResponse)[routekitResponseBrand] === true
}

/**
 * Test whether a value is a final body wrapper.
 *
 * @example
 * ```ts
 * const value = isRoutekitBody(result) ? result.value : result
 * ```
 *
 * @param value - Value to inspect.
 * @returns Whether `value` was created by [`body`]{@link body}.
 */
export function isRoutekitBody(value: unknown): value is RoutekitBody {
    return !!value && (value as RoutekitBody)[routekitBodyBrand] === true
}

/**
 * Test whether a value is a generator directive.
 *
 * @example
 * ```ts
 * if (isRoutekitDirective(value)) console.log(value.kind)
 * ```
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a Routekit generator directive.
 */
export function isRoutekitDirective(value: unknown): value is Exclude<RoutekitYield, undefined> {
    return !!value && (value as BaseDirective)[routekitDirectiveBrand] === true
}

/**
 * Test whether a value is a status directive.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` was created by [`status`]{@link status}.
 */
export function isStatusDirective(value: unknown): value is StatusDirective {
    return isRoutekitDirective(value) && value.kind === 'status'
}

/**
 * Test whether a value is a headers directive.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` was created by [`headers`]{@link headers}.
 */
export function isHeadersDirective(value: unknown): value is HeadersDirective {
    return isRoutekitDirective(value) && value.kind === 'headers'
}

/**
 * Test whether a value is a head directive.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` was created by [`head`]{@link head}.
 */
export function isHeadDirective(value: unknown): value is HeadDirective {
    return isRoutekitDirective(value) && value.kind === 'head'
}

/**
 * Test whether a value is a stream directive.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` was created by [`stream`]{@link stream}.
 */
export function isStreamDirective(value: unknown): value is StreamDirective {
    return isRoutekitDirective(value) && value.kind === 'stream'
}

/**
 * Test whether a value is a chunk directive.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` was created by [`chunk`]{@link chunk}.
 */
export function isChunkDirective(value: unknown): value is ChunkDirective {
    return isRoutekitDirective(value) && value.kind === 'chunk'
}

function makeDirective<T extends BaseDirective>(directive: Omit<T, typeof routekitDirectiveBrand>) {
    return {
        [routekitDirectiveBrand]: true,
        ...directive,
    } as T
}

/**
 * Create a logical response.
 *
 * If `headers` contains `Content-Type`, the body must be compatible with the native
 * [`Response`]{@link Response} constructor because the router will skip negotiation.
 *
 * @example
 * ```ts
 * return response({ok: true}, {status: 202})
 * ```
 *
 * @param responseBody - Logical or represented response body.
 * @param init - Response status and headers.
 * @returns Routekit logical response.
 */
export function response<const T>(
    responseBody: T,
    init: RoutekitResponseInit = {},
): RoutekitResponse<T> {
    const responseHeaders = new Headers(init.headers)
    if (hasContentType(responseHeaders) && !isResponseBodyInit(responseBody)) {
        throw new TypeError(
            'Routekit response has Content-Type set, so body must be a native Response body.',
        )
    }
    return {
        [routekitResponseBrand]: true,
        status: init.status ?? HttpStatus.OK,
        headers: responseHeaders,
        body: responseBody,
    }
}

/**
 * Create a `200 OK` logical response.
 *
 * @example
 * ```ts
 * return ok({payload: 'ready'})
 * ```
 *
 * @param responseBody - Logical response body.
 * @param init - Response headers.
 * @returns Routekit logical response.
 */
export function ok<const T>(
    responseBody: T,
    init: Omit<RoutekitResponseInit, 'status'> = {},
): RoutekitResponse<T> {
    return response(responseBody, { ...init, status: HttpStatus.OK })
}

/**
 * Create a represented `text/plain` response.
 *
 * @example
 * ```ts
 * return text('pong')
 * ```
 *
 * @param value - Text response body.
 * @param init - Response status and headers.
 * @returns Routekit logical response with `Content-Type` set.
 */
export function text(value: string, init: RoutekitResponseInit = {}): RoutekitResponse<string> {
    const responseHeaders = new Headers(init.headers)
    responseHeaders.set(CommonHeaders.CONTENT_TYPE, CommonContentTypes.PLAIN_TEXT)
    responseHeaders.set(
        CommonHeaders.CONTENT_LENGTH,
        fullWide(new TextEncoder().encode(value).length),
    )
    return response(value, {
        ...init,
        headers: responseHeaders,
        status: init.status ?? HttpStatus.OK,
    })
}

/**
 * Create a represented `text/html` response.
 *
 * @example
 * ```ts
 * return html('<h1>Hello</h1>')
 * ```
 *
 * @param value - HTML response body.
 * @param init - Response status and headers.
 * @returns Routekit logical response with `Content-Type` set.
 */
export function html(value: string, init: RoutekitResponseInit = {}): RoutekitResponse<string> {
    const responseHeaders = new Headers(init.headers)
    responseHeaders.set(CommonHeaders.CONTENT_TYPE, CommonContentTypes.HTML)
    responseHeaders.set(
        CommonHeaders.CONTENT_LENGTH,
        fullWide(new TextEncoder().encode(value).length),
    )
    return response(value, {
        ...init,
        headers: responseHeaders,
        status: init.status ?? HttpStatus.OK,
    })
}

/**
 * Create an empty response with the provided status.
 *
 * @example
 * ```ts
 * return empty(HttpStatus.ACCEPTED)
 * ```
 *
 * @param statusCode - HTTP status code to use.
 * @param init - Response headers.
 * @returns Routekit logical response with no body.
 */
export function empty(
    statusCode: number | HttpStatus = HttpStatus.NO_CONTENT,
    init: Omit<RoutekitResponseInit, 'status'> = {},
): RoutekitResponse<undefined> {
    return response(undefined, { ...init, status: statusCode })
}

/**
 * Create a `204 No Content` response.
 *
 * @example
 * ```ts
 * return noContent()
 * ```
 *
 * @returns Routekit logical response with no body.
 */
export function noContent(): RoutekitResponse<undefined> {
    return empty(HttpStatus.NO_CONTENT)
}

/**
 * Create a redirect response.
 *
 * @example
 * ```ts
 * return redirect('/login')
 * ```
 *
 * @param url - Redirect target URL.
 * @param statusCode - Redirect status code. Defaults to `302`.
 * @returns Routekit logical response with a `Location` header.
 */
export function redirect(
    url: string,
    statusCode: number | HttpStatus = HttpStatus.FOUND,
): RoutekitResponse<undefined> {
    return empty(statusCode, { headers: { Location: url } })
}

/**
 * Wrap a returned value as the final response body.
 *
 * @example
 * ```ts
 * return body({payload: 'done'})
 * ```
 *
 * @param value - Logical response body.
 * @returns Final body wrapper.
 */
export function body<const T>(value: T): RoutekitBody<T> {
    return {
        [routekitBodyBrand]: true,
        value,
    }
}

/**
 * Create a generator directive that sets the response status.
 *
 * @example
 * ```ts
 * yield status(HttpStatus.ACCEPTED)
 * ```
 *
 * @param statusCode - HTTP status code to use.
 * @returns Status directive.
 */
export function status(statusCode: number | HttpStatus): StatusDirective {
    return makeDirective<StatusDirective>({
        kind: 'status',
        status: statusCode,
    })
}

/**
 * Create a generator directive that merges response headers.
 *
 * @example
 * ```ts
 * yield headers({'cache-control': 'no-store'})
 * ```
 *
 * @param init - Headers to merge into the response.
 * @returns Headers directive.
 */
export function headers(init: RouterHeadersInit): HeadersDirective {
    return makeDirective<HeadersDirective>({
        kind: 'headers',
        headers: new Headers(init),
    })
}

/**
 * Create a generator directive that sets response status and headers.
 *
 * @example
 * ```ts
 * yield head(HttpStatus.OK, {'cache-control': 'no-store'})
 * ```
 *
 * @param statusCode - HTTP status code to use.
 * @param init - Headers to merge into the response.
 * @returns Head directive.
 */
export function head(statusCode: number | HttpStatus, init: RouterHeadersInit = {}): HeadDirective {
    return makeDirective<HeadDirective>({
        kind: 'head',
        status: statusCode,
        headers: new Headers(init),
    })
}

/**
 * Create a generator directive that selects a structured stream framer.
 *
 * @example
 * ```ts
 * yield stream(sseFramer())
 * ```
 *
 * @param framer - Stream framer to use for subsequent chunks.
 * @param init - Additional stream headers.
 * @returns Stream directive.
 */
export function stream<const T>(
    framer: StreamFramer<T>,
    init: RouterHeadersInit = {},
): StreamDirective<T> {
    const streamHeaders = new Headers(framer.headers)
    new Headers(init).forEach((value, key) => streamHeaders.set(key, value))
    return makeDirective<StreamDirective<T>>({
        kind: 'stream',
        framer,
        headers: streamHeaders,
    })
}

/**
 * Create a generator directive that emits one stream chunk.
 *
 * @example
 * ```ts
 * yield chunk({event: 'ready'})
 * ```
 *
 * @param value - Chunk value to stream.
 * @returns Chunk directive.
 */
export function chunk<const T>(value: T): ChunkDirective<T> {
    return makeDirective<ChunkDirective<T>>({
        kind: 'chunk',
        value,
    })
}

/**
 * Create the default JSON body serializer.
 *
 * @example
 * ```ts
 * const router = new Router({serializers: [jsonSerializer()]})
 * ```
 *
 * @returns Serializer for `application/json`.
 */
export function jsonSerializer(): BodySerializer<unknown> {
    return {
        mediaTypes: [CommonContentTypes.JSON],
        canSerialize: (_value): _value is unknown => true,
        serialize: (value) => (value === undefined ? null : JSON.stringify(value)),
    }
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
