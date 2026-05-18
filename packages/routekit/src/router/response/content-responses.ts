import { CommonContentTypes, CommonHeaders, HttpStatus } from '@mpen/http'
import { fullWide } from '../lib/format'
import { response, type RoutekitResponse, type RoutekitResponseInit } from './core'

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
