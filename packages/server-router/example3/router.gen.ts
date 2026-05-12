// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-api-client.ts "./example3/router.ts" -w -p

import {
  FetchTransport,
  resolveApiResponseByStatus,
  withQuery,
  type ClientCallOptions,
  type ClientTransport,
  type ApiResponseByStatusPromise,
} from '@mpen/server-router/client'

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V }
  ? V
  : unknown

export interface PostWidgetsByIdPathParams {
  id: number
}

export interface PostWidgetsByIdQuery {
  view: 'summary' | 'full'
}

export interface PostWidgetsByIdRequest {
  name: string
  tags: string[]
}

export interface PostWidgetsByIdResponse200 {
  id: number
  name: string
  view: 'summary' | 'full'
  tags: string[]
  summary: string
}

export interface PostWidgetsByIdResponse400 {
  component: 'request_body' | 'url_path' | 'query_parameters'
  message: string
}

export interface PostWidgetsByIdResponsesByStatus {
  '200': PostWidgetsByIdResponse200
  '400': PostWidgetsByIdResponse400
}
export type PostWidgetsByIdResponse =
  PostWidgetsByIdResponsesByStatus[keyof PostWidgetsByIdResponsesByStatus]

export interface PostWidgetsByIdOptions extends ClientCallOptions {
  path: PostWidgetsByIdPathParams | SinglePathParam<PostWidgetsByIdPathParams, 'id'>
  query: PostWidgetsByIdQuery
  body: PostWidgetsByIdRequest
}

export class ApiClient {
  private readonly transport: ClientTransport

  constructor(transport?: ClientTransport) {
    this.transport = transport ?? new FetchTransport()
  }

  get widgets(): ApiClient_Widgets {
    return new ApiClient_Widgets(this.transport)
  }
}

class ApiClient_Widgets {
  constructor(private readonly transport: ClientTransport) {}

  get byId(): ApiClient_Widgets_ById {
    return new ApiClient_Widgets_ById(this.transport)
  }
}

class ApiClient_Widgets_ById {
  constructor(private readonly transport: ClientTransport) {}
  post(
    options: PostWidgetsByIdOptions,
  ): ApiResponseByStatusPromise<PostWidgetsByIdResponsesByStatus> {
    const { path, query, body, ...callOptions } = options
    const _path =
      typeof path === 'object' && path !== null && !Array.isArray(path)
        ? path
        : ({ id: path } as any)
    return resolveApiResponseByStatus<PostWidgetsByIdResponsesByStatus>(
      this.transport.request<PostWidgetsByIdResponse, PostWidgetsByIdRequest>({
        routeId: 'postWidgetsById',
        url: withQuery(`/widgets/${encodeURIComponent(String(_path.id))}`, query),
        init: {
          ...callOptions.init,
          method: 'POST',
          headers: callOptions.headers,
          signal: callOptions.signal,
        },
        body,
        bodyCodec: callOptions.bodyCodec,
      }),
    )
  }
}
