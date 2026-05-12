import type { MaybePromise } from './promise'

/**
 * Context passed to global header providers.
 *
 * @example
 * ```ts
 * const headers = (context: ClientHeaderContext) =>
 *     context.url.startsWith('/admin') ? { authorization: `Bearer ${token}` } : undefined
 * ```
 */
export interface ClientHeaderContext {
    /** The request URL before base URL resolution. */
    url: string
    /** The request init object before execution. */
    init: RequestInit
}

/**
 * Headers or a function that provides headers for each request.
 *
 * @example
 * ```ts
 * const headers: ClientHeaders = () => ({ authorization: `Bearer ${token}` })
 * ```
 */
export type ClientHeaders =
    | HeadersInit
    | ((context: ClientHeaderContext) => MaybePromise<HeadersInit | undefined>)
