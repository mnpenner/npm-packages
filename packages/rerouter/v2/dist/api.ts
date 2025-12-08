import {NeverjectPromise} from 'neverject'

interface OkResponse<T> {
    body: T
}

interface FetchError {
    message: string
}

export type CustomPromise<T> = NeverjectPromise<OkResponse<T>,FetchError>
