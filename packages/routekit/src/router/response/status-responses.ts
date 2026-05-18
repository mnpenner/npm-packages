import { HttpStatus } from '@mpen/http'
import { response, type RoutekitResponse, type RoutekitResponseInit } from './core'

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
 * Create a `400 Bad Request` logical response.
 *
 * @example
 * ```ts
 * return badRequest({message: 'Invalid request'})
 * ```
 *
 * @param responseBody - Logical response body.
 * @param init - Response headers.
 * @returns Routekit logical response.
 */
export function badRequest<const T>(
    responseBody: T,
    init: Omit<RoutekitResponseInit, 'status'> = {},
): RoutekitResponse<T> {
    return response(responseBody, { ...init, status: HttpStatus.BAD_REQUEST })
}

/**
 * Create a `422 Unprocessable Content` logical response.
 *
 * @example
 * ```ts
 * return unprocessableContent({message: 'Email is already taken'})
 * ```
 *
 * @param responseBody - Logical response body.
 * @param init - Response headers.
 * @returns Routekit logical response.
 */
export function unprocessableContent<const T>(
    responseBody: T,
    init: Omit<RoutekitResponseInit, 'status'> = {},
): RoutekitResponse<T> {
    return response(responseBody, { ...init, status: HttpStatus.UNPROCESSABLE_ENTITY })
}
