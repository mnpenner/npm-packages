// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-api-client.ts ./examples/router-instance.ts ./examples/api-client.gen.ts

export interface Fetcher {
    fetch(url: string, init: RequestInit): unknown
}

export type TypedResponse<T> = Omit<Response, 'json'> & { json(): Promise<T> }
export type PromisedResponse<T> = Promise<TypedResponse<T>>

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown

export type GetIndexResponse = { message: string; }

export type GetNamedRouteResponse = { message: string; }

export type PostNamedRouteResponse = { message: string; }

export type PostFooBarResponse = { message: string; }

export type PostBooksByIdPathParams = { id: number; }
export type PostBooksByIdRequest = { title: string; author: string; }
export type PostBooksByIdResponse = { id: number; title: string; author: string; }

export type GetJsonHelperResponse = { message: string; }

export type PostJsonHelperZodRequest = { tag: string; }
export type PostJsonHelperZodResponse = { ok: boolean; tag: string; }

export type GetHealthResponse = unknown

export type HeadHealthResponse = never

export type PostSubmitResponse = unknown

export type PutItemsByIdResponse = unknown

export type DeleteItemsByIdResponse = unknown

export type PatchItemsByIdResponse = unknown

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

    get jsonHelper(): ApiClient_JsonHelper {
        return new ApiClient_JsonHelper(this.fetcher)
    }

    get jsonHelperZod(): ApiClient_JsonHelperZod {
        return new ApiClient_JsonHelperZod(this.fetcher)
    }

    get health(): ApiClient_Health {
        return new ApiClient_Health(this.fetcher)
    }

    get submit(): ApiClient_Submit {
        return new ApiClient_Submit(this.fetcher)
    }

    get itemsById(): ApiClient_ItemsById {
        return new ApiClient_ItemsById(this.fetcher)
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
    post(path: PostBooksByIdPathParams | SinglePathParam<PostBooksByIdPathParams, "id">, body: PostBooksByIdRequest) {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch(`/books/${_path.id}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        }) as PromisedResponse<PostBooksByIdResponse>
    }
}

class ApiClient_JsonHelper {
    constructor(private readonly fetcher: Fetcher) {}
    get() {
        return this.fetcher.fetch("/json-helper", {
            method: "GET",
        }) as PromisedResponse<GetJsonHelperResponse>
    }
}

class ApiClient_JsonHelperZod {
    constructor(private readonly fetcher: Fetcher) {}
    post(body: PostJsonHelperZodRequest) {
        return this.fetcher.fetch("/json-helper-zod", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        }) as PromisedResponse<PostJsonHelperZodResponse>
    }
}

class ApiClient_Health {
    constructor(private readonly fetcher: Fetcher) {}
    get() {
        return this.fetcher.fetch("/health", {
            method: "GET",
        }) as PromisedResponse<GetHealthResponse>
    }

    head() {
        return this.fetcher.fetch("/health", {
            method: "HEAD",
        }) as PromisedResponse<HeadHealthResponse>
    }
}

class ApiClient_Submit {
    constructor(private readonly fetcher: Fetcher) {}
    post() {
        return this.fetcher.fetch("/submit", {
            method: "POST",
        }) as PromisedResponse<PostSubmitResponse>
    }
}

class ApiClient_ItemsById {
    constructor(private readonly fetcher: Fetcher) {}
    put(path: any | any) {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch(`/items/${_path.id}`, {
            method: "PUT",
        }) as PromisedResponse<PutItemsByIdResponse>
    }

    delete(path: any | any) {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch(`/items/${_path.id}`, {
            method: "DELETE",
        }) as PromisedResponse<DeleteItemsByIdResponse>
    }

    patch(path: any | any) {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch(`/items/${_path.id}`, {
            method: "PATCH",
        }) as PromisedResponse<PatchItemsByIdResponse>
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
