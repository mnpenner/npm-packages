import type {UriTemplate, UrlParamValue, UriMatch, UriParams} from '@mpen/rerouter'

export interface BunResponse {

}

export interface BunRequest {
    headers: Headers
    method: HttpRequestMethod
    body: RequestBody
    url: BunUrl
}

export interface RequestBody {
    stream(): ReadableStream | null

    text(): Promise<string>

    json(): Promise<any>

    blob(): Promise<Blob>

    buffer(): Promise<ArrayBuffer>

    infer(): Promise<unknown>

    used: boolean
}

export interface BunUrl extends URL {
    /** Params parsed out of the path according to the UriTemplate. */
    params: UriParams
    /** Path relative to the origin. Includes `pathname`, `search` and `hash` if available. */
    path: string
}

export type Handler = (req: BunRequest, res: BunResponse) => Promise<Response>

export type RouteMap = Record<string,Route>

export interface Route {
    template: UriTemplate

    get?: Handler
    post?: Handler
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
export const HttpRequestMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'] as const
export type HttpRequestMethod = typeof HttpRequestMethods[number]
