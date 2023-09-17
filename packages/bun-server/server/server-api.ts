import type {UriTemplate, UrlParamValue, UriMatch, UriParams} from '@mpen/rerouter'
import {AnyFn} from './util'
import {HybridResponse} from './bun-response'


export type Chunkable = string|ArrayBufferLike|TypedArray

export interface BunResponseInterface {

    respond(res: Response): void
    respond(...args: ConstructorParameters<typeof Response>): void

    status: number | bigint;
    sendHeaders(headers: HeadersInit): void

    write(chunk: Chunkable): void
    tryWrite(chunk: Chunkable): boolean
    close(): void
    error(e: Error): void
}

export interface BunRequestInterface {
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

export type Handler = (req: BunRequestInterface, res: HybridResponse) => void|Promise<void>

export type RouteMap = Record<string,Route>

export interface Route {
    template: UriTemplate

    get?: Handler
    post?: Handler
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
export const HttpRequestMethods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'] as const
export type HttpRequestMethod = typeof HttpRequestMethods[number]



// export interface ReadableHTTPResponseSinkController {
//     close: AnyFn,
//     flush: AnyFn,
//     end: AnyFn,
//     start: AnyFn,
//     write: AnyFn,
//     sinkId: number
// }
