import type { ClientHeaders } from '../headers'
import type { ApiTransportResponsePromise, ClientRequest, ClientTransport } from '../transport'
import { jsonBodyCodec, type BodyCodec } from './body-codec'

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
    fetch?: (url: string | URL | Request, init?: RequestInit) => Promise<Response>
    /** Global headers, or a function that returns headers for each request. */
    headers?: ClientHeaders
    /** Default body codec. Defaults to [`jsonBodyCodec`]{@link jsonBodyCodec}. */
    bodyCodec?: BodyCodec
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
     * @returns A transport response promise.
     */
    async request(request: ClientRequest): ApiTransportResponsePromise {
        const codec = this.#bodyCodec
        const init: RequestInit = { ...request.init }
        const headerContext = { url: request.url, init }
        const providedHeaders =
            typeof this.#headers === 'function' ? await this.#headers(headerContext) : this.#headers
        const headers = mergeHeaders(providedHeaders, init.headers)

        if (Object.hasOwn(request, 'body')) {
            const body = codec.serialize(request.body)
            if (body != null) {
                init.body = body
            }
        }

        if ([...headers].length > 0) {
            init.headers = headers
        } else {
            delete init.headers
        }

        const response = await this.#fetch(resolveUrl(request.url, this.#baseUrl), init)
        return {
            status: response.status,
            headers: response.headers,
            parseBody: () => codec.deserialize(response.body, response.headers.get('content-type')),
        }
    }
}
