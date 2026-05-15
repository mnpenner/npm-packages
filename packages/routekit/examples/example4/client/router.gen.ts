// Do not modify this file. It was auto-generated with the following command:
// $ bun ../../src/bin/gen-api-client.ts ./server/router.ts -o ./client/router.gen.ts -p

import {
  FetchTransport,
  resolveApiResponse,
  type ClientCallOptions,
  type ClientTransport,
  type ApiResponsePromise,
} from '@mpen/routekit/client'

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V }
  ? V
  : unknown

export type GetIndexResponse = unknown

export interface GetIndexOptions extends ClientCallOptions {}

export type GetUsersByIdResponse = unknown

export interface GetUsersByIdOptions extends ClientCallOptions {
  path: any | any
}

export class ApiClient {
  private readonly transport: ClientTransport

  constructor(transport?: ClientTransport) {
    this.transport = transport ?? new FetchTransport()
  }

  get usersById(): ApiClient_UsersById {
    return new ApiClient_UsersById(this.transport)
  }

  get(options: GetIndexOptions = {}): ApiResponsePromise<GetIndexResponse> {
    const callOptions = options
    return resolveApiResponse(
      this.transport.request({
        url: '/',
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
  get(options: GetUsersByIdOptions): ApiResponsePromise<GetUsersByIdResponse> {
    const { path, ...callOptions } = options
    const _path =
      typeof path === 'object' && path !== null && !Array.isArray(path)
        ? path
        : ({ id: path } as any)
    return resolveApiResponse(
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
