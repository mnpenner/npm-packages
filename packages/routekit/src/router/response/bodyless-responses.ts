import { HttpStatus } from '@mpen/http'
import { response, type RoutekitResponse, type RoutekitResponseInit } from './core'

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
