import type { NeverjectPromise } from 'neverject'

export interface Fetcher<TErr> {
    fetch<TOk>(url: string, init: RequestInit): NeverjectPromise<OkRes<TOk>, TErr>
}

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown

export type GetIndexResponse = { message: string; }

export type GetNamedRouteResponse = { message: string; }

export type PostNamedRouteResponse = { message: string; }

export type PostFooBarResponse = { message: string; }

export type PostBooks$idPathParams = { id: string; }
export type PostBooks$idRequest = { title: string; author: string; }
export type PostBooks$idResponse = { id: string; title: string; author: string; }



export class ApiClient<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}

    get namedRoute(): ApiClientNamedRoute<TErr> {
        return new ApiClientNamedRoute<TErr>(this.fetcher)
    }

    get foo(): ApiClientFoo<TErr> {
        return new ApiClientFoo<TErr>(this.fetcher)
    }

    get books(): ApiClientBooks<TErr> {
        return new ApiClientBooks<TErr>(this.fetcher)
    }

    $get(): NeverjectPromise<GetIndexResponse, TErr> {
        return this.fetcher.fetch<GetIndexResponse>("/", {
            method: "GET",
        })
    }
}

class ApiClientNamedRoute<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}
    $get(): NeverjectPromise<GetNamedRouteResponse, TErr> {
        return this.fetcher.fetch<GetNamedRouteResponse>("/name/bar", {
            method: "GET",
        })
    }

    $post(): NeverjectPromise<PostNamedRouteResponse, TErr> {
        return this.fetcher.fetch<PostNamedRouteResponse>("/name/bar", {
            method: "POST",
        })
    }
}

class ApiClientFoo<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}

    get bar(): ApiClientFooBar<TErr> {
        return new ApiClientFooBar<TErr>(this.fetcher)
    }
}

class ApiClientFooBar<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}
    $post(): NeverjectPromise<PostFooBarResponse, TErr> {
        return this.fetcher.fetch<PostFooBarResponse>("/foo/bar", {
            method: "POST",
        })
    }
}

class ApiClientBooks<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}

    get $id(): ApiClientBooks$id<TErr> {
        return new ApiClientBooks$id<TErr>(this.fetcher)
    }
}

class ApiClientBooks$id<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}
    $post(path: PostBooks$idPathParams | SinglePathParam<PostBooks$idPathParams, "id">, body: PostBooks$idRequest): NeverjectPromise<PostBooks$idResponse, TErr> {
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return this.fetcher.fetch<PostBooks$idResponse>(`/books/${_path.id}`, {
            method: "POST",
            body: JSON.stringify(body),
        })
    }
}
