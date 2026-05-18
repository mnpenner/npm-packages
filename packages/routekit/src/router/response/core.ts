import { CommonHeaders, HttpStatus } from '@mpen/http'
import type { RouterBodyInit, RouterHeadersInit } from '../fetch-types'

const routekitResponseBrand: unique symbol = Symbol('RoutekitResponse')
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
