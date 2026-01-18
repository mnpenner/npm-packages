import {CommonHeaders, HttpStatus, CommonContentTypes, StatusText} from '@mpen/http-helpers'
import type {ResponseWithData} from '../types'
import {fullWide} from '../lib/format'

const utf8encoder = new TextEncoder()


type JsonResponse<T> = ResponseWithData<T>
type NonJsonResponse = ResponseWithData<never>

export function jsonResponse<T>(data: T, status: number | HttpStatus = HttpStatus.OK, init?: Omit<ResponseInit,'status'>) {
    const encoded = utf8encoder.encode(JSON.stringify(data))

    const headers = new Headers(init?.headers)
    headers.set(CommonHeaders.CONTENT_LENGTH, fullWide(encoded.length))
    headers.set(CommonHeaders.CONTENT_TYPE, CommonContentTypes.JSON)

    return new Response(encoded, {
        ...init,
        status,
        headers,
    }) as JsonResponse<T>
}

export function plainTextResponse(data: string, status: number | HttpStatus = HttpStatus.OK) {
    const encoded = utf8encoder.encode(data)
    return new Response(encoded, {
        status,
        headers: {
            [CommonHeaders.CONTENT_LENGTH]: fullWide(encoded.length),
            [CommonHeaders.CONTENT_TYPE]: CommonContentTypes.PLAIN_TEXT,
        }
    }) as NonJsonResponse
}

export function htmlResponse(data: string, status: number | HttpStatus = HttpStatus.OK) {
    const encoded = utf8encoder.encode(data)
    return new Response(encoded, {
        status,
        headers: {
            [CommonHeaders.CONTENT_LENGTH]: fullWide(encoded.length),
            [CommonHeaders.CONTENT_TYPE]: CommonContentTypes.HTML,
        }
    }) as NonJsonResponse
}


export function notImplemented() {
    return simpleStatus(HttpStatus.NOT_IMPLEMENTED)
}

export function internalServerError() {
    return simpleStatus(HttpStatus.INTERNAL_SERVER_ERROR)
}

export function notFound() {
    return simpleStatus(HttpStatus.NOT_FOUND)
}

export function simpleStatus(status: HttpStatus) {
    return plainTextResponse(StatusText[status] ?? `HTTP Status ${status}`, status)
}

export function redirect(url: string, status: number = HttpStatus.FOUND) {
    return new Response(null, {
        status,
        headers: { Location: url },
    })
}


export function noContent() {
    return new Response(null, {status: HttpStatus.NO_CONTENT}) as NonJsonResponse
}
