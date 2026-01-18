import {CommonHeaders, HttpStatus, CommonContentTypes} from '@mpen/http-helpers'
import {fullWide} from '../lib/format'

const utf8encoder = new TextEncoder()


export function jsonResponse<T>(data: T, status: number | HttpStatus = HttpStatus.OK, init?: Omit<ResponseInit,'status'>) {
    const encoded = utf8encoder.encode(JSON.stringify(data))

    const headers = new Headers(init?.headers)
    headers.set(CommonHeaders.CONTENT_LENGTH, fullWide(encoded.length))
    headers.set(CommonHeaders.CONTENT_TYPE, CommonContentTypes.JSON)

    return new Response(encoded, {
        ...init,
        status,
        headers,
    }) as ResponseWithData<T>
}

export function plainTextResponse(data: string, status: number | HttpStatus = HttpStatus.OK) {
    const encoded = utf8encoder.encode(data)
    return new Response(encoded, {
        status,
        headers: {
            [CommonHeaders.CONTENT_LENGTH]: fullWide(encoded.length),
            [CommonHeaders.CONTENT_TYPE]: CommonContentTypes.PLAIN_TEXT,
        }
    }) as ResponseWithData<string>
}

export function htmlResponse(data: string, status: number | HttpStatus = HttpStatus.OK) {
    const encoded = utf8encoder.encode(data)
    return new Response(encoded, {
        status,
        headers: {
            [CommonHeaders.CONTENT_LENGTH]: fullWide(encoded.length),
            [CommonHeaders.CONTENT_TYPE]: CommonContentTypes.HTML,
        }
    }) as ResponseWithData<string>
}


export function notImplemented() {
    return new Response(null, {status: HttpStatus.NOT_IMPLEMENTED})
}

export function redirect(url: string, status: number = HttpStatus.FOUND) {
    return new Response(null, {
        status,
        headers: { Location: url },
    })
}


export function noContent() {
    return new Response(null, {status: HttpStatus.NO_CONTENT}) as ResponseWithData<void>
}
