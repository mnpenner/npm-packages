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

export type CompiledRouteMap<T extends Record<string, any>> = {
    [R in keyof T]: CompiledRoute<T[R]>;
}

export type PatternRouteMap<T extends Record<string, any>> = {
    [R in keyof T]: PatternRoute<T[R]>;
}


export function routeMap<T extends Record<string, any>>(arg: CompiledRouteMap<T>) { return arg; }

// export type RouteMap = Record<string, CompiledRoute<any>>
// export type RouteMap = {
//     [k in string]: Route<UriParams>
// }

export function createRoute<P extends UriParams>(obj: CompiledRoute<P>) {
    return obj
}

export interface MethodHandlers<P extends UriParams=any> {
    request?: Handler<P>
    get?: Handler<P>
    head?: Handler<P>
    post?: Handler<P>
    put?: Handler<P>
    delete?: Handler<P>
    connect?: Handler<P>
    options?: Handler<P>
    trace?: Handler<P>
    patch?: Handler<P>
}

export interface CompiledRoute<P extends UriParams=any> extends MethodHandlers<P> {
    template: UriTemplate<P>
}

export interface NamedRoute<P extends UriParams=any> extends CompiledRoute<P> {
    name: string|undefined
}

export interface PatternRoute<P extends UriParams=any> extends MethodHandlers<P> {
    url: string|UriTemplate<P>
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
