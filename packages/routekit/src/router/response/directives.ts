import type { HttpStatus } from '@mpen/http'
import type { RouterHeadersInit } from '../fetch-types'
import type { StreamFramer } from './framers'

const routekitDirectiveBrand: unique symbol = Symbol('RoutekitDirective')

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
