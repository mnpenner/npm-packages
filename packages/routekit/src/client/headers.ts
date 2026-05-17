import type { MaybePromise } from './promise'

type ClientHeadersInit = NonNullable<ConstructorParameters<typeof Headers>[0]>

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
    | ClientHeadersInit
    | ((context: ClientHeaderContext) => MaybePromise<ClientHeadersInit | undefined>)
