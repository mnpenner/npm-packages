- Remove the `$` before `$get()`, `$post()`, etc.
- Allow custom "ApiClient" name (`--client-name "CustomApiClient"`)
  - Sub-clients should become "CustomApiCient_RouteName" 
- Change URL pattern to name convention
  - `/books/:id` should become "BooksById"
  - `/books/:year/:month` should become "BooksByYearByMonth"
  - `/books/:year(\d+)/:month` should also be "BooksByYearByMonth"
  - `/books/:year/categories/:category` should become "BooksByYearCategoriesByCategory"
  - Change the fetcher interface to 
      ```ts
        interface Fetcher {
          fetch(url: string, init: RequestInit): unknown
        }
      ```
- Allow adding custom import headers
  - `--import-type "NeverjectPromise:neverject"` adds `import type { NeverjectPromise } from 'neverject'`
  - `--import-type "Foo,Bar:@org/baz` adds `import type { Foo, Bar } from '@org/baz'`
  - This is repeatable for multiple imports
- Allow custom response type
  - `--response-type "CustomPromise"`
- Drop support for `--neverject`
- Don't specify the return type for methods, just add ` as ...` at the end.

All together:

```sh
bun v2/gen-api-client.ts v2/router-instance.ts v2/dist/api-client.gen.ts \
  --client-name "CustomApiClient" \
  --import-type "CustomPromise:./api.ts" \
  --response-type "CustomPromise"
```

Should generate:

```ts
import type {CustomPromise } from './api.ts'

interface Fetcher {
    fetch(url: string, init: RequestInit): unknown
}

...

export class CustomApiClient {
    constructor(private readonly fetcher: Fetcher) {}

    get(body: GetIndexRequest) {
        return this.fetcher.fetch("/", {
            method: "GET",
        }) as CustomPromise<GetIndexResponse>
    }
}
```
