import type { ApiTransportResponse, ApiTransportResponsePromise } from './transport'

/**
 * A typed response returned by generated API clients.
 *
 * @example
 * ```ts
 * const response: ApiResponse<{ ok: true }> = await client.health.get()
 * if (response.status === 200) {
 * const body = await response.parseBody()
 * }
 * ```
 *
 * @typeParam T - The parsed response body type.
 */
export interface ApiResponse<T> {
    /** Whether the response status is in the successful 200-299 range. */
    ok: boolean
    /** The response status code. */
    status: number
    /** The response headers. */
    headers: Headers

    /**
     * Parse the response body with the active body codec.
     *
     * @returns The parsed response body.
     */
    parseBody(): Promise<T>
}

type ApiResponseStatus<TStatus> = TStatus extends number
    ? TStatus
    : TStatus extends `${infer TNumber extends number}`
      ? TNumber
      : number

/**
 * A typed response union keyed by HTTP status code.
 *
 * @example
 * ```ts
 * type WidgetResponse = ApiResponseByStatus<{
 *     200: { id: number }
 *     400: { message: string }
 * }>
 *
 * if (response.status === 400) {
 *     const body = await response.parseBody()
 *     body.message
 * }
 * ```
 *
 * @typeParam T - A map from response status codes to parsed response body types.
 */
export type ApiResponseByStatus<T extends object> = {
    [TStatus in keyof T]: Omit<ApiResponse<T[TStatus]>, 'status' | 'parseBody'> & {
        /** The narrowed response status code. */
        status: ApiResponseStatus<TStatus>

        /**
         * Parse the response body for this status code with the active body codec.
         *
         * @returns The parsed response body for this status code.
         */
        parseBody(): Promise<T[TStatus]>
    }
}[keyof T]

/**
 * The default async response wrapper used by generated API clients.
 *
 * @example
 * ```ts
 * const response: ApiResponsePromise<{ id: number }> = client.items.byId.get({ path: 123 })
 * ```
 *
 * @typeParam T - The parsed response body type.
 */
export type ApiResponsePromise<T> = Promise<ApiResponse<T>>

/**
 * The async response wrapper used by generated API clients for routes with response body types
 * keyed by HTTP status code.
 *
 * @example
 * ```ts
 * const response: ApiResponseByStatusPromise<{ 200: { ok: true } }> = client.health.get()
 * ```
 *
 * @typeParam T - A map from response status codes to parsed response body types.
 */
export type ApiResponseByStatusPromise<T extends object> = Promise<ApiResponseByStatus<T>>

/**
 * Normalize a transport response into the public generated API response shape.
 *
 * @example
 * ```ts
 * const response = await resolveApiResponse(transport.request(request))
 * ```
 *
 * @param response - A transport response or transport response promise.
 * @returns The normalized API response.
 * @typeParam T - The parsed response body type.
 */
export async function resolveApiResponse<T>(
    response: ApiTransportResponse | ApiTransportResponsePromise,
): ApiResponsePromise<T> {
    const resolved = await response
    return {
        ok: resolved.status >= 200 && resolved.status < 300,
        status: resolved.status,
        headers: new Headers(resolved.headers),
        parseBody: resolved.parseBody as () => Promise<T>,
    }
}

/**
 * Normalize a transport response into a generated API response union keyed by status code.
 *
 * @example
 * ```ts
 * const response = await resolveApiResponseByStatus<{ 200: { ok: true } }>(
 *     transport.request(request),
 * )
 * ```
 *
 * @param response - A transport response or transport response promise.
 * @returns The normalized API response.
 * @typeParam T - A map from response status codes to parsed response body types.
 */
export function resolveApiResponseByStatus<T extends object>(
    response: ApiTransportResponse | ApiTransportResponsePromise,
): ApiResponseByStatusPromise<T> {
    return resolveApiResponse(response) as ApiResponseByStatusPromise<T>
}
