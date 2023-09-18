import type {UriTemplate, UrlParamValue, UriMatch, UriParams} from '@mpen/rerouter'
import {AnyFn, PartialRecord} from './util'

import {HybridResponse} from './hybrid-response'
import {BunRequest} from './bun-request'


export type Chunkable = string | ArrayBufferLike | TypedArray

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

export type Handler<P extends UriParams=any> = (req: BunRequest<P>, res: HybridResponse) => void | Promise<void>

export type RouteMap = Record<string, Route<any>>
// export type RouteMap = {
//     [k in string]: Route<UriParams>
// }

export function createRoute<P extends UriParams>(obj: Route<P>) {
    return obj
}

export interface Route<P extends UriParams=any> {
    template: UriTemplate<P>
    get?: Handler<P>
    post?: Handler<P>
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
