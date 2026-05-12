// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-api-client.ts "./examples/example1/server/router-instance.ts" -o "./examples/example1/client/api-client.gen.ts"

import { FetchTransport, resolveApiResponse, resolveApiResponseByStatus, type ClientCallOptions, type ClientTransport, type ApiResponseByStatusPromise, type ApiResponsePromise } from '@mpen/server-router/client'

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V } ? V : unknown

export interface GetIndexResponse200 {
  message: string;
}

export interface GetIndexResponsesByStatus {
    "200": GetIndexResponse200
}
export type GetIndexResponse = GetIndexResponsesByStatus[keyof GetIndexResponsesByStatus]

export interface GetIndexOptions extends ClientCallOptions {
}

export interface GetNamedRouteResponse200 {
  message: string;
}

export interface GetNamedRouteResponsesByStatus {
    "200": GetNamedRouteResponse200
}
export type GetNamedRouteResponse = GetNamedRouteResponsesByStatus[keyof GetNamedRouteResponsesByStatus]

export interface GetNamedRouteOptions extends ClientCallOptions {
}

export interface PostNamedRouteResponse200 {
  message: string;
}

export interface PostNamedRouteResponsesByStatus {
    "200": PostNamedRouteResponse200
}
export type PostNamedRouteResponse = PostNamedRouteResponsesByStatus[keyof PostNamedRouteResponsesByStatus]

export interface PostNamedRouteOptions extends ClientCallOptions {
}

export interface PostFooBarResponse200 {
  message: string;
}

export interface PostFooBarResponsesByStatus {
    "200": PostFooBarResponse200
}
export type PostFooBarResponse = PostFooBarResponsesByStatus[keyof PostFooBarResponsesByStatus]

export interface PostFooBarOptions extends ClientCallOptions {
}

export interface PostBooksByIdPathParams {
  id: number;
}

export interface PostBooksByIdRequest {
  title: string;
  author: string;
}

export interface PostBooksByIdResponse200 {
  id: number;
  title: string;
  author: string;
}

export interface PostBooksByIdResponsesByStatus {
    "200": PostBooksByIdResponse200
}
export type PostBooksByIdResponse = PostBooksByIdResponsesByStatus[keyof PostBooksByIdResponsesByStatus]

export interface PostBooksByIdOptions extends ClientCallOptions {
    path: PostBooksByIdPathParams | SinglePathParam<PostBooksByIdPathParams, "id">
    body: PostBooksByIdRequest
}

export interface GetJsonHelperResponse200 {
  message: string;
}

export interface GetJsonHelperResponsesByStatus {
    "200": GetJsonHelperResponse200
}
export type GetJsonHelperResponse = GetJsonHelperResponsesByStatus[keyof GetJsonHelperResponsesByStatus]

export interface GetJsonHelperOptions extends ClientCallOptions {
}

export interface PostJsonHelperZodRequest {
  tag: string;
}

export interface PostJsonHelperZodResponse200 {
  ok: boolean;
  tag: string;
}

export interface PostJsonHelperZodResponsesByStatus {
    "200": PostJsonHelperZodResponse200
}
export type PostJsonHelperZodResponse = PostJsonHelperZodResponsesByStatus[keyof PostJsonHelperZodResponsesByStatus]

export interface PostJsonHelperZodOptions extends ClientCallOptions {
    body: PostJsonHelperZodRequest
}

export type GetHealthResponse = unknown

export interface GetHealthOptions extends ClientCallOptions {
}

export type HeadHealthResponse = never

export interface HeadHealthOptions extends ClientCallOptions {
}

export type PostSubmitResponse = unknown

export interface PostSubmitOptions extends ClientCallOptions {
}

export type PutItemsByIdResponse = unknown

export interface PutItemsByIdOptions extends ClientCallOptions {
    path: any | any
}

export type DeleteItemsByIdResponse = unknown

export interface DeleteItemsByIdOptions extends ClientCallOptions {
    path: any | any
}

export type PatchItemsByIdResponse = unknown

export interface PatchItemsByIdOptions extends ClientCallOptions {
    path: any | any
}

export type GetGenResponse = unknown

export interface GetGenOptions extends ClientCallOptions {
}

export class ApiClient {
    private readonly transport: ClientTransport

    constructor(transport?: ClientTransport) {
        this.transport = transport ?? new FetchTransport()
    }

    get namedRoute(): ApiClient_NamedRoute {
        return new ApiClient_NamedRoute(this.transport)
    }

    get foo(): ApiClient_Foo {
        return new ApiClient_Foo(this.transport)
    }

    get booksById(): ApiClient_BooksById {
        return new ApiClient_BooksById(this.transport)
    }

    get jsonHelper(): ApiClient_JsonHelper {
        return new ApiClient_JsonHelper(this.transport)
    }

    get jsonHelperZod(): ApiClient_JsonHelperZod {
        return new ApiClient_JsonHelperZod(this.transport)
    }

    get health(): ApiClient_Health {
        return new ApiClient_Health(this.transport)
    }

    get submit(): ApiClient_Submit {
        return new ApiClient_Submit(this.transport)
    }

    get itemsById(): ApiClient_ItemsById {
        return new ApiClient_ItemsById(this.transport)
    }

    get gen(): ApiClient_Gen {
        return new ApiClient_Gen(this.transport)
    }

    get(options: GetIndexOptions = {}): ApiResponseByStatusPromise<GetIndexResponsesByStatus> {
        const callOptions = options
        return resolveApiResponseByStatus<GetIndexResponsesByStatus>(this.transport.request<GetIndexResponse>({
            url: "/",
            init: {
                ...callOptions.init,
                method: "GET",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}

class ApiClient_NamedRoute {
    constructor(private readonly transport: ClientTransport) {}
    get(options: GetNamedRouteOptions = {}): ApiResponseByStatusPromise<GetNamedRouteResponsesByStatus> {
        const callOptions = options
        return resolveApiResponseByStatus<GetNamedRouteResponsesByStatus>(this.transport.request<GetNamedRouteResponse>({
            url: "/name/bar",
            init: {
                ...callOptions.init,
                method: "GET",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }

    post(options: PostNamedRouteOptions = {}): ApiResponseByStatusPromise<PostNamedRouteResponsesByStatus> {
        const callOptions = options
        return resolveApiResponseByStatus<PostNamedRouteResponsesByStatus>(this.transport.request<PostNamedRouteResponse>({
            url: "/name/bar",
            init: {
                ...callOptions.init,
                method: "POST",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}

class ApiClient_Foo {
    constructor(private readonly transport: ClientTransport) {}

    get bar(): ApiClient_Foo_Bar {
        return new ApiClient_Foo_Bar(this.transport)
    }
}

class ApiClient_Foo_Bar {
    constructor(private readonly transport: ClientTransport) {}
    post(options: PostFooBarOptions = {}): ApiResponseByStatusPromise<PostFooBarResponsesByStatus> {
        const callOptions = options
        return resolveApiResponseByStatus<PostFooBarResponsesByStatus>(this.transport.request<PostFooBarResponse>({
            url: "/foo/bar",
            init: {
                ...callOptions.init,
                method: "POST",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}

class ApiClient_BooksById {
    constructor(private readonly transport: ClientTransport) {}
    post(options: PostBooksByIdOptions): ApiResponseByStatusPromise<PostBooksByIdResponsesByStatus> {
        const { path, body, ...callOptions } = options
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return resolveApiResponseByStatus<PostBooksByIdResponsesByStatus>(this.transport.request<PostBooksByIdResponse, PostBooksByIdRequest>({
            url: `/books/${encodeURIComponent(String(_path.id))}`,
            init: {
                ...callOptions.init,
                method: "POST",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
            body,
        }))
    }
}

class ApiClient_JsonHelper {
    constructor(private readonly transport: ClientTransport) {}
    get(options: GetJsonHelperOptions = {}): ApiResponseByStatusPromise<GetJsonHelperResponsesByStatus> {
        const callOptions = options
        return resolveApiResponseByStatus<GetJsonHelperResponsesByStatus>(this.transport.request<GetJsonHelperResponse>({
            url: "/json-helper",
            init: {
                ...callOptions.init,
                method: "GET",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}

class ApiClient_JsonHelperZod {
    constructor(private readonly transport: ClientTransport) {}
    post(options: PostJsonHelperZodOptions): ApiResponseByStatusPromise<PostJsonHelperZodResponsesByStatus> {
        const { body, ...callOptions } = options
        return resolveApiResponseByStatus<PostJsonHelperZodResponsesByStatus>(this.transport.request<PostJsonHelperZodResponse, PostJsonHelperZodRequest>({
            url: "/json-helper-zod",
            init: {
                ...callOptions.init,
                method: "POST",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
            body,
        }))
    }
}

class ApiClient_Health {
    constructor(private readonly transport: ClientTransport) {}
    get(options: GetHealthOptions = {}): ApiResponsePromise<GetHealthResponse> {
        const callOptions = options
        return resolveApiResponse(this.transport.request<GetHealthResponse>({
            url: "/health",
            init: {
                ...callOptions.init,
                method: "GET",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }

    head(options: HeadHealthOptions = {}): ApiResponsePromise<HeadHealthResponse> {
        const callOptions = options
        return resolveApiResponse(this.transport.request<HeadHealthResponse>({
            url: "/health",
            init: {
                ...callOptions.init,
                method: "HEAD",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}

class ApiClient_Submit {
    constructor(private readonly transport: ClientTransport) {}
    post(options: PostSubmitOptions = {}): ApiResponsePromise<PostSubmitResponse> {
        const callOptions = options
        return resolveApiResponse(this.transport.request<PostSubmitResponse>({
            url: "/submit",
            init: {
                ...callOptions.init,
                method: "POST",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}

class ApiClient_ItemsById {
    constructor(private readonly transport: ClientTransport) {}
    put(options: PutItemsByIdOptions): ApiResponsePromise<PutItemsByIdResponse> {
        const { path, ...callOptions } = options
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return resolveApiResponse(this.transport.request<PutItemsByIdResponse>({
            url: `/items/${encodeURIComponent(String(_path.id))}`,
            init: {
                ...callOptions.init,
                method: "PUT",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }

    delete(options: DeleteItemsByIdOptions): ApiResponsePromise<DeleteItemsByIdResponse> {
        const { path, ...callOptions } = options
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return resolveApiResponse(this.transport.request<DeleteItemsByIdResponse>({
            url: `/items/${encodeURIComponent(String(_path.id))}`,
            init: {
                ...callOptions.init,
                method: "DELETE",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }

    patch(options: PatchItemsByIdOptions): ApiResponsePromise<PatchItemsByIdResponse> {
        const { path, ...callOptions } = options
        const _path = typeof path === 'object' && path !== null && !Array.isArray(path) ? path : { id: path } as any
        return resolveApiResponse(this.transport.request<PatchItemsByIdResponse>({
            url: `/items/${encodeURIComponent(String(_path.id))}`,
            init: {
                ...callOptions.init,
                method: "PATCH",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}

class ApiClient_Gen {
    constructor(private readonly transport: ClientTransport) {}
    get(options: GetGenOptions = {}): ApiResponsePromise<GetGenResponse> {
        const callOptions = options
        return resolveApiResponse(this.transport.request<GetGenResponse>({
            url: "/gen",
            init: {
                ...callOptions.init,
                method: "GET",
                headers: callOptions.headers,
                signal: callOptions.signal,
            },
        }))
    }
}
