// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-api-client.ts "./example3/router.ts" -w -p

export interface Fetcher {
  fetch(url: string, init: RequestInit): unknown
}

export type TypedResponse<T> = Omit<Response, 'json'> & { json(): Promise<T> }
export type PromisedResponse<T> = Promise<TypedResponse<T>>

type SinglePathParam<TParams, TKey extends string> = TParams extends { [K in TKey]: infer V }
  ? V
  : unknown

function withQuery(url: string, query: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null)
          searchParams.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item))
      }
      continue
    }
    searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  const search = searchParams.toString()
  return search.length > 0 ? `${url}?${search}` : url
}

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

export class ApiClient {
  constructor(private readonly fetcher: Fetcher) {}

  get widgets(): ApiClient_Widgets {
    return new ApiClient_Widgets(this.fetcher)
  }
}

class ApiClient_Widgets {
  constructor(private readonly fetcher: Fetcher) {}

  get byId(): ApiClient_Widgets_ById {
    return new ApiClient_Widgets_ById(this.fetcher)
  }
}

class ApiClient_Widgets_ById {
  constructor(private readonly fetcher: Fetcher) {}
  post(
    path: PostWidgetsByIdPathParams | SinglePathParam<PostWidgetsByIdPathParams, 'id'>,
    query: PostWidgetsByIdQuery,
    body: PostWidgetsByIdRequest,
  ) {
    const _path =
      typeof path === 'object' && path !== null && !Array.isArray(path)
        ? path
        : ({ id: path } as any)
    return this.fetcher.fetch(withQuery(`/widgets/${_path.id}`, query), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }) as PromisedResponse<PostWidgetsByIdResponse>
  }
}
