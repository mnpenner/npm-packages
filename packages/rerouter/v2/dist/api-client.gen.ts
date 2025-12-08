// Do not modify this file. It was auto-generated with the following command:
// $ bun "v2/gen-api-client.ts" "v2/router-instance.ts" "v2/dist/api-client.gen.ts" --client-name CustomApiClient --import-type CustomPromise:./api.ts --response-type CustomPromise

import type { CustomPromise } from './api.ts'

export interface Fetcher {
    fetch(url: string, init: RequestInit): unknown
}

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown

export type GetIndexResponse = { message: string; }

export type GetNamedRouteResponse = { message: string; }

export type PostNamedRouteResponse = { message: string; }

export type PostFooBarResponse = { message: string; }

export type PostBooksByIdPathParams = { id: string; }
export type PostBooksByIdRequest = { title: string; author: string; }
export type PostBooksByIdResponse = { id: string; title: string; author: string; }

export class CustomApiClient {
    constructor(private readonly fetcher: Fetcher) {}

    get namedRoute(): CustomApiClient_NamedRoute {
        return new CustomApiClient_NamedRoute(this.fetcher)
    }

    get foo(): CustomApiClient_Foo {
        return new CustomApiClient_Foo(this.fetcher)
    }

    get BooksById(): CustomApiClient_BooksById {
        return new CustomApiClient_BooksById(this.fetcher)
    }

    get() {
        return this.fetcher.fetch("/", {
            method: "GET",
        }) as CustomPromise<GetIndexResponse>
    }
}

class CustomApiClient_NamedRoute {
    constructor(private readonly fetcher: Fetcher) {}
    get() {
        return this.fetcher.fetch("/name/bar", {
            method: "GET",
        }) as CustomPromise<GetNamedRouteResponse>
    }

    post() {
        return this.fetcher.fetch("/name/bar", {
            method: "POST",
        }) as CustomPromise<PostNamedRouteResponse>
    }
}

class CustomApiClient_Foo {
    constructor(private readonly fetcher: Fetcher) {}

    get bar(): CustomApiClient_Foo_Bar {
        return new CustomApiClient_Foo_Bar(this.fetcher)
    }
}

class CustomApiClient_Foo_Bar {
    constructor(private readonly fetcher: Fetcher) {}
    post() {
        return this.fetcher.fetch("/foo/bar", {
            method: "POST",
        }) as CustomPromise<PostFooBarResponse>
    }
}

class CustomApiClient_BooksById {
    constructor(private readonly fetcher: Fetcher) {}
    post(path: PostBooksByIdPathParams | SinglePathParam<PostBooksByIdPathParams, "id">, body: PostBooksByIdRequest) {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch(`/books/${_path.id}`, {
            method: "POST",
            body: JSON.stringify(body),
        }) as CustomPromise<PostBooksByIdResponse>
    }
}
