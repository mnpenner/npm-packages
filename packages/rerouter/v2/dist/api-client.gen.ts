import type { NeverjectPromise } from 'neverject'

export interface Fetcher<TErr> {
    fetch<TOk>(url: string, init: RequestInit): NeverjectPromise<TOk, TErr>
}

export type GetIndexResponse = { message: string; }

export type PostBooks$idPathParams = { id: string; }
export type PostBooks$idRequest = { title: string; author: string; }
export type PostBooks$idResponse = { id: string; title: string; author: string; }

export class ApiClient<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}

    getIndex(): NeverjectPromise<GetIndexResponse, TErr> {
        return this.fetcher.fetch<GetIndexResponse>("/", {
            method: "GET",
        })
    }

    postBooks$id(path: PostBooks$idPathParams, body: PostBooks$idRequest): NeverjectPromise<PostBooks$idResponse, TErr> {
        return this.fetcher.fetch<PostBooks$idResponse>(`/books/${path.id}`, {
            method: "POST",
            body: JSON.stringify(body),
        })
    }

}