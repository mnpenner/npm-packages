// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-api-client.ts ./examples/router-instance.ts ./examples/api-client.gen.ts

export interface Fetcher {
    fetch(url: string, init: RequestInit): unknown
}

export type TypedResponse<T> = Response & { json(): Promise<T> }
export type PromisedResponse<T> = Promise<TypedResponse<T>>

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown

export type GetIndexResponse = unknown

export type GetNamedRouteResponse = unknown

export type PostNamedRouteResponse = unknown

export type PostFooBarResponse = unknown

export type PostBooksByIdResponse = unknown

export type GetGenResponse = unknown

export class ApiClient {
    constructor(private readonly fetcher: Fetcher) {}

    get namedRoute(): ApiClient_NamedRoute {
        return new ApiClient_NamedRoute(this.fetcher)
    }

    get foo(): ApiClient_Foo {
        return new ApiClient_Foo(this.fetcher)
    }

    get booksById(): ApiClient_BooksById {
        return new ApiClient_BooksById(this.fetcher)
    }

    get gen(): ApiClient_Gen {
        return new ApiClient_Gen(this.fetcher)
    }

    get() {
        return this.fetcher.fetch("/", {
            method: "GET",
        }) as PromisedResponse<GetIndexResponse>
    }
}

class ApiClient_NamedRoute {
    constructor(private readonly fetcher: Fetcher) {}
    get() {
        return this.fetcher.fetch("/name/bar", {
            method: "GET",
        }) as PromisedResponse<GetNamedRouteResponse>
    }

    post() {
        return this.fetcher.fetch("/name/bar", {
            method: "POST",
        }) as PromisedResponse<PostNamedRouteResponse>
    }
}

class ApiClient_Foo {
    constructor(private readonly fetcher: Fetcher) {}

    get bar(): ApiClient_Foo_Bar {
        return new ApiClient_Foo_Bar(this.fetcher)
    }
}

class ApiClient_Foo_Bar {
    constructor(private readonly fetcher: Fetcher) {}
    post() {
        return this.fetcher.fetch("/foo/bar", {
            method: "POST",
        }) as PromisedResponse<PostFooBarResponse>
    }
}

class ApiClient_BooksById {
    constructor(private readonly fetcher: Fetcher) {}
    post(path: any | any) {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch(`/books/${_path.id}`, {
            method: "POST",
        }) as PromisedResponse<PostBooksByIdResponse>
    }
}

class ApiClient_Gen {
    constructor(private readonly fetcher: Fetcher) {}
    get() {
        return this.fetcher.fetch("/gen", {
            method: "GET",
        }) as PromisedResponse<GetGenResponse>
    }
}
