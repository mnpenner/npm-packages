// Do not modify this file. It was auto-generated with the following command:
// $ bun ../../src/bin/gen-api-client.ts ./server/router.ts -o ./client/router.gen.ts -p

import {
  FetchTransport,
  resolveApiResponseByStatus,
  type ClientCallOptions,
  type ClientTransport,
  type ApiResponseByStatusPromise,
} from '@mpen/routekit/client'

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V }
  ? V
  : unknown

export interface GetHealthResponse200 {
  ok: true
}

export type NoName = {
  kind: 'schema' | 'validation' | 'transformation'
  type: string
  input: unknown
  expected: string | null
  received: string
  message: string
  requirement?: unknown
  path?: unknown
  issues?: NoName
  lang?: string
  abortEarly?: boolean
  abortPipeEarly?: boolean
  skipPipe?: boolean
}[]

export interface GetHealthResponse400 {
  component: number
  issues: {
    kind: 'schema' | 'validation' | 'transformation'
    type: string
    input: unknown
    expected: string | null
    received: string
    message: string
    requirement?: unknown
    path?: unknown
    issues?: NoName
    lang?: string
    abortEarly?: boolean
    abortPipeEarly?: boolean
    skipPipe?: boolean
  }[]
}

export interface GetHealthResponse418 {
  tea: string
}

export type GetHealthResponsedefault = unknown

export interface GetHealthResponsesByStatus {
  '200': GetHealthResponse200
  '400': GetHealthResponse400
  '418': GetHealthResponse418
  default: GetHealthResponsedefault
}
export type GetHealthResponse = GetHealthResponsesByStatus[keyof GetHealthResponsesByStatus]

export interface GetHealthOptions extends ClientCallOptions {}

export interface GetUsersByIdPathParams {
  id: string | number
}

export interface GetUsersByIdResponse200 {
  userId: number
}

export type NoName = {
  kind: 'schema' | 'validation' | 'transformation'
  type: string
  input: unknown
  expected: string | null
  received: string
  message: string
  requirement?: unknown
  path?: unknown
  issues?: NoName
  lang?: string
  abortEarly?: boolean
  abortPipeEarly?: boolean
  skipPipe?: boolean
}[]

export interface GetUsersByIdResponse400 {
  component: number
  issues: {
    kind: 'schema' | 'validation' | 'transformation'
    type: string
    input: unknown
    expected: string | null
    received: string
    message: string
    requirement?: unknown
    path?: unknown
    issues?: NoName
    lang?: string
    abortEarly?: boolean
    abortPipeEarly?: boolean
    skipPipe?: boolean
  }[]
}

export type GetUsersByIdResponsedefault = unknown

export interface GetUsersByIdResponsesByStatus {
  '200': GetUsersByIdResponse200
  '400': GetUsersByIdResponse400
  default: GetUsersByIdResponsedefault
}
export type GetUsersByIdResponse =
  GetUsersByIdResponsesByStatus[keyof GetUsersByIdResponsesByStatus]

export interface GetUsersByIdOptions extends ClientCallOptions {
  path: GetUsersByIdPathParams | SinglePathParam<GetUsersByIdPathParams, 'id'>
}

export class ApiClient {
  private readonly transport: ClientTransport

  constructor(transport?: ClientTransport) {
    this.transport = transport ?? new FetchTransport()
  }

  get health(): ApiClient_Health {
    return new ApiClient_Health(this.transport)
  }

  get usersById(): ApiClient_UsersById {
    return new ApiClient_UsersById(this.transport)
  }
}

class ApiClient_Health {
  constructor(private readonly transport: ClientTransport) {}
  get(options: GetHealthOptions = {}): ApiResponseByStatusPromise<GetHealthResponsesByStatus> {
    const callOptions = options
    return resolveApiResponseByStatus<GetHealthResponsesByStatus>(
      this.transport.request({
        url: '/health',
        init: {
          ...callOptions.init,
          method: 'GET',
          headers: callOptions.headers,
          signal: callOptions.signal,
        },
      }),
    )
  }
}

class ApiClient_UsersById {
  constructor(private readonly transport: ClientTransport) {}
  get(options: GetUsersByIdOptions): ApiResponseByStatusPromise<GetUsersByIdResponsesByStatus> {
    const { path, ...callOptions } = options
    const _path =
      typeof path === 'object' && path !== null && !Array.isArray(path)
        ? path
        : ({ id: path } as any)
    return resolveApiResponseByStatus<GetUsersByIdResponsesByStatus>(
      this.transport.request({
        url: `/users/${encodeURIComponent(String(_path.id))}`,
        init: {
          ...callOptions.init,
          method: 'GET',
          headers: callOptions.headers,
          signal: callOptions.signal,
        },
      }),
    )
  }
}
