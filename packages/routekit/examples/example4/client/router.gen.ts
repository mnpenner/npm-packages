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

export interface GetUsersByIdPathParams {
  id: string
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

export interface GetUsersByIdResponsedefault {
  [k: string]: unknown
}

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

  get usersById(): ApiClient_UsersById {
    return new ApiClient_UsersById(this.transport)
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
