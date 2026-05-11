/**
 * A value that may be returned immediately or through a promise.
 *
 * @example
 * ```ts
 * const headers: MaybePromise<HeadersInit> = { authorization: 'Bearer token' }
 * ```
 *
 * @typeParam T - The resolved value type.
 */
export type MaybePromise<T> = T | Promise<T>

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
    /** The unmodified platform response, when the transport has one. */
    response?: Response
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
 * A minimal response returned by client transports.
 *
 * @example
 * ```ts
 * const response: ApiTransportResponse<{ ok: true }> = {
 *     status: 200,
 *     parseBody: async () => ({ ok: true }),
 * }
 * ```
 *
 * @typeParam T - The parsed response body type.
 */
export interface ApiTransportResponse<T> {
    /** The unmodified platform response, when the transport has one. */
    response?: Response
    /** The response status code. */
    status: number
    /** The response headers, when available. */
    headers?: HeadersInit

    /**
     * Parse the response body with the transport's active body codec.
     *
     * @returns The parsed response body.
     */
    parseBody(): Promise<T>
}

/**
 * The async response wrapper returned by client transports.
 *
 * @example
 * ```ts
 * const response: ApiTransportResponsePromise<{ ok: true }> = transport.request(request)
 * ```
 *
 * @typeParam T - The parsed response body type.
 */
export type ApiTransportResponsePromise<T> = Promise<ApiTransportResponse<T>>

/**
 * Context passed to body serializers.
 *
 * @example
 * ```ts
 * const codec: BodyCodec = {
 *     contentType: 'application/json',
 *     serialize(value, context) {
 *         console.log(context.routeId)
 *         return JSON.stringify(value)
 *     },
 *     deserialize: (response) => response.json(),
 * }
 * ```
 */
export interface SerializeBodyContext {
    /** The generated route identifier, such as `postWidgetsById`. */
    routeId: string
    /** The URL path before a transport applies a base URL. */
    url: string
    /** The request init object being prepared for the transport. */
    init: RequestInit
}

/**
 * Context passed to body deserializers.
 *
 * @example
 * ```ts
 * const codec: BodyCodec = {
 *     contentType: 'application/json',
 *     serialize: JSON.stringify,
 *     deserialize(response, context) {
 *         if (context.status === 204) return Promise.resolve(undefined)
 *         return response.json()
 *     },
 * }
 * ```
 */
export interface DeserializeBodyContext {
    /** The generated route identifier, such as `postWidgetsById`. */
    routeId: string
    /** The URL path before a transport applies a base URL. */
    url: string
    /** The HTTP response status. */
    status: number
    /** The response content type, when present. */
    contentType: string | null
}

/**
 * Serializes request bodies and deserializes response bodies for generated clients.
 *
 * @example
 * ```ts
 * const textJsonCodec: BodyCodec = {
 *     contentType: 'application/json',
 *     serialize: (value) => JSON.stringify(value),
 *     deserialize: async (response) => JSON.parse(await response.text()),
 * }
 * ```
 */
export interface BodyCodec {
    /** The content type to apply when the request has a body and no explicit content type. */
    contentType?: string

    /**
     * Serialize a generated client body value into a Fetch-compatible body.
     *
     * @param value - The generated client body value.
     * @param context - Metadata for the route call being serialized.
     * @returns A Fetch-compatible body, or nullish to omit the request body.
     */
    serialize(value: unknown, context: SerializeBodyContext): BodyInit | null | undefined

    /**
     * Deserialize a response body for typed `response.parseBody()` calls.
     *
     * @param response - The response returned by the transport.
     * @param context - Metadata for the response being deserialized.
     * @returns The deserialized response body.
     * @typeParam T - The expected response body type.
     */
    deserialize<T>(response: Response, context: DeserializeBodyContext): Promise<T>
}

/**
 * The default JSON codec used by generated API clients.
 *
 * @example
 * ```ts
 * const client = new ApiClient(new FetchTransport({ bodyCodec: jsonBodyCodec }))
 * ```
 */
export const jsonBodyCodec: BodyCodec = {
    contentType: 'application/json',
    serialize: (value) => JSON.stringify(value),
    deserialize: (response) => response.json(),
}

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
    headers?: HeadersInit
    /** Abort signal for this call. */
    signal?: AbortSignal
    /** Body codec override for this call. */
    bodyCodec?: BodyCodec
    /** Additional request init fields for this call. */
    init?: Omit<RequestInit, 'body' | 'headers' | 'method' | 'signal'>
}

/**
 * A generated client request before it is executed by a transport.
 *
 * @example
 * ```ts
 * const request: ClientRequest<{ name: string }> = {
 *     routeId: 'postWidgets',
 *     url: '/widgets',
 *     init: { method: 'POST' },
 *     body: { name: 'demo' },
 * }
 * ```
 *
 * @typeParam TBody - The generated request body type.
 */
export interface ClientRequest<TBody = unknown> {
    /** The generated route identifier, such as `postWidgetsById`. */
    routeId: string
    /** The URL path generated for the route. */
    url: string
    /** Fetch-compatible request initialization. */
    init: RequestInit
    /** The unencoded request body value. */
    body?: TBody
    /** Body codec override for this request. */
    bodyCodec?: BodyCodec
}

/**
 * Transport used by generated API clients to execute typed requests.
 *
 * @example
 * ```ts
 * class AxiosTransport implements ClientTransport {
 *     async request<TResponse>(request: ClientRequest): ApiTransportResponsePromise<TResponse> {
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
     * @returns A typed response promise.
     * @typeParam TResponse - The expected response body type.
     * @typeParam TBody - The request body type.
     */
    request<TResponse, TBody = unknown>(
        request: ClientRequest<TBody>,
    ): ApiTransportResponsePromise<TResponse>
}

/**
 * Context passed to global header providers.
 *
 * @example
 * ```ts
 * const headers = (context: ClientHeaderContext) => ({
 *     'x-route-id': context.routeId,
 * })
 * ```
 */
export interface ClientHeaderContext {
    /** The generated route identifier, such as `postWidgetsById`. */
    routeId: string
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

/**
 * Options for [`FetchTransport`]{@link FetchTransport}.
 *
 * @example
 * ```ts
 * const transport = new FetchTransport({
 *     baseUrl: 'https://api.example.com',
 *     headers: () => ({ authorization: `Bearer ${token}` }),
 * })
 * ```
 */
export interface FetchTransportOptions {
    /** Base URL used to resolve generated relative route URLs. */
    baseUrl?: string | URL
    /** Fetch implementation to call. Defaults to `globalThis.fetch`. */
    fetch?: typeof fetch
    /** Global headers, or a function that returns headers for each request. */
    headers?: ClientHeaders
    /** Default body codec. Defaults to [`jsonBodyCodec`]{@link jsonBodyCodec}. */
    bodyCodec?: BodyCodec
}

function hasHeader(headers: Headers, name: string): boolean {
    return headers.has(name)
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
    const headers = new Headers()
    for (const source of sources) {
        if (!source) continue
        new Headers(source).forEach((value, key) => {
            headers.set(key, value)
        })
    }
    return headers
}

function resolveUrl(url: string, baseUrl: string | URL | undefined): string {
    return baseUrl ? new URL(url, baseUrl).toString() : url
}

/**
 * Fetch-based transport for generated API clients.
 *
 * @example
 * ```ts
 * const client = new ApiClient(
 *     new FetchTransport({
 *         baseUrl: 'https://api.example.com',
 *         headers: { authorization: 'Bearer token' },
 *     }),
 * )
 * ```
 */
export class FetchTransport implements ClientTransport {
    readonly #baseUrl: string | URL | undefined
    readonly #bodyCodec: BodyCodec
    readonly #fetch: typeof fetch
    readonly #headers: ClientHeaders | undefined

    /**
     * Create a Fetch-backed generated client transport.
     *
     * @param options - Transport configuration.
     */
    constructor(options: FetchTransportOptions = {}) {
        this.#baseUrl = options.baseUrl
        this.#bodyCodec = options.bodyCodec ?? jsonBodyCodec
        this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis)
        this.#headers = options.headers
    }

    /**
     * Execute a generated client request with Fetch.
     *
     * @param request - The generated client request.
     * @returns A typed response promise.
     * @typeParam TResponse - The expected response body type.
     * @typeParam TBody - The request body type.
     */
    async request<TResponse, TBody = unknown>(
        request: ClientRequest<TBody>,
    ): ApiTransportResponsePromise<TResponse> {
        const codec = request.bodyCodec ?? this.#bodyCodec
        const init: RequestInit = { ...request.init }
        const headerContext = { routeId: request.routeId, url: request.url, init }
        const providedHeaders =
            typeof this.#headers === 'function' ? await this.#headers(headerContext) : this.#headers
        const headers = mergeHeaders(providedHeaders, init.headers)

        if (Object.hasOwn(request, 'body')) {
            const body = codec.serialize(request.body, {
                routeId: request.routeId,
                url: request.url,
                init,
            })
            if (body != null) {
                init.body = body
            }
            if (codec.contentType && !hasHeader(headers, 'content-type')) {
                headers.set('content-type', codec.contentType)
            }
        }

        if ([...headers].length > 0) {
            init.headers = headers
        } else {
            delete init.headers
        }

        const response = await this.#fetch(resolveUrl(request.url, this.#baseUrl), init)
        return {
            response,
            status: response.status,
            headers: response.headers,
            parseBody: () =>
                codec.deserialize<TResponse>(response.clone(), {
                    routeId: request.routeId,
                    url: request.url,
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                }),
        }
    }
}

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
    response: ApiTransportResponse<T> | ApiTransportResponsePromise<T>,
): ApiResponsePromise<T> {
    const resolved = await response
    return {
        response: resolved.response,
        ok: resolved.status >= 200 && resolved.status < 300,
        status: resolved.status,
        headers: new Headers(resolved.headers),
        parseBody: resolved.parseBody,
    }
}

/**
 * Append an object of query values to a URL.
 *
 * @example
 * ```ts
 * withQuery('/widgets', { view: 'full', tag: ['a', 'b'] })
 * ```
 *
 * @param url - URL without generated query parameters.
 * @param query - Query parameter object.
 * @returns The URL with serialized query parameters.
 */
export function withQuery(url: string, query: object): string {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value == null) continue
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item != null)
                    searchParams.append(
                        key,
                        typeof item === 'object' ? JSON.stringify(item) : String(item),
                    )
            }
            continue
        }
        searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }
    const search = searchParams.toString()
    return search.length > 0 ? `${url}?${search}` : url
}
