type ClientHeadersInit = NonNullable<ConstructorParameters<typeof Headers>[0]>

/**
 * Optional per-call settings accepted by generated API client methods.
 *
 * @example
 * ```ts
 * await client.widgets.byId.post({
 *     path: 123,
 *     query: { view: 'full' },
 *     body: { name: 'Mark', tags: [] },
 *     signal: abortController.signal,
 * })
 * ```
 */
export interface ClientCallOptions {
    /** Additional headers for this call. */
    headers?: ClientHeadersInit
    /** Abort signal for this call. */
    signal?: AbortSignal
    /** Additional request init fields for this call. */
    init?: Omit<RequestInit, 'body' | 'headers' | 'method' | 'signal'>
}

/**
 * A generated client request before it is executed by a transport.
 *
 * @example
 * ```ts
 * const request: ClientRequest = {
 *     url: '/widgets',
 *     init: { method: 'POST' },
 *     body: { name: 'demo' },
 * }
 * ```
 */
export interface ClientRequest {
    /** The URL path generated for the route. */
    url: string
    /** Fetch-compatible request initialization. */
    init: RequestInit
    /** The unencoded request body value. */
    body?: unknown
}

/**
 * A minimal response returned by client transports.
 *
 * @example
 * ```ts
 * const response: ApiTransportResponse = {
 *     status: 200,
 *     parseBody: async () => ({ ok: true }),
 * }
 * ```
 */
export interface ApiTransportResponse {
    /** The response status code. */
    status: number
    /** The response headers, when available. */
    headers?: ClientHeadersInit

    /**
     * Parse the response body with the transport's active body codec.
     *
     * @returns The parsed response body.
     */
    parseBody(): Promise<unknown>
}

/**
 * The async response wrapper returned by client transports.
 *
 * @example
 * ```ts
 * const response: ApiTransportResponsePromise = transport.request(request)
 * ```
 */
export type ApiTransportResponsePromise = Promise<ApiTransportResponse>

/**
 * Transport used by generated API clients to execute typed requests.
 *
 * @example
 * ```ts
 * class AxiosTransport implements ClientTransport {
 *     async request(request: ClientRequest): ApiTransportResponsePromise {
 *         throw new Error('Adapt Axios into a Response-shaped object here')
 *     }
 * }
 * ```
 */
export interface ClientTransport {
    /**
     * Execute a generated client request.
     *
     * @param request - The generated request metadata and init.
     * @returns A transport response promise.
     */
    request(request: ClientRequest): ApiTransportResponsePromise
}
