export interface Fetcher {
    fetch(input: string, init: RequestInit): Promise<Response>
}

export type TypedResponse<T> = Response & { json(): Promise<T> }
export type PromisedResponse<T> = Promise<TypedResponse<T>>

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown

export type GetIndexResponse = { message: string; }

export type GetNamedRouteResponse = { message: string; }

export type PostNamedRouteResponse = { message: string; }

export type PostFooBarResponse = { message: string; }

export type PostBooks$idPathParams = { id: string; }
export type PostBooks$idRequest = { title: string; author: string; }
export type PostBooks$idResponse = { id: string; title: string; author: string; }

export class ApiClient {
    constructor(private readonly fetcher: Fetcher) {}

    get namedRoute(): ApiClientNamedRoute {
        return new ApiClientNamedRoute(this.fetcher)
    }

    get foo(): ApiClientFoo {
        return new ApiClientFoo(this.fetcher)
    }

    get books(): ApiClientBooks {
        return new ApiClientBooks(this.fetcher)
    }

    $get(): PromisedResponse<GetIndexResponse> {
        return this.fetcher.fetch("/", {
            method: "GET",
        }) as PromisedResponse<GetIndexResponse>
    }
}

class ApiClientNamedRoute {
    constructor(private readonly fetcher: Fetcher) {}
    delete(): PromisedResponse<GetNamedRouteResponse> {
        return this.fetcher.fetch("/name/bar", {
            method: "GET",
        }) as PromisedResponse<GetNamedRouteResponse>
    }

    post(): PromisedResponse<PostNamedRouteResponse> {
        return this.fetcher.fetch("/name/bar", {
            method: "POST",
        }) as PromisedResponse<PostNamedRouteResponse>
    }
}

const c = new ApiClientNamedRoute(null)

c.delete()

class ApiClientFoo {
    constructor(private readonly fetcher: Fetcher) {}

    get bar(): ApiClientFooBar {
        return new ApiClientFooBar(this.fetcher)
    }
}

class ApiClientFooBar {
    constructor(private readonly fetcher: Fetcher) {}
    $post(): PromisedResponse<PostFooBarResponse> {
        return this.fetcher.fetch("/foo/bar", {
            method: "POST",
        }) as PromisedResponse<PostFooBarResponse>
    }
}

class ApiClientBooks {
    constructor(private readonly fetcher: Fetcher) {}

    get $id(): ApiClientBooks$id {
        return new ApiClientBooks$id(this.fetcher)
    }
}

class ApiClientBooks$id {
    constructor(private readonly fetcher: Fetcher) {}
    $post(path: PostBooks$idPathParams | SinglePathParam<PostBooks$idPathParams, "id">, body: PostBooks$idRequest): PromisedResponse<PostBooks$idResponse> {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch(`/books/${_path.id}`, {
            method: "POST",
            body: JSON.stringify(body),
        }) as PromisedResponse<PostBooks$idResponse>
    }
}
