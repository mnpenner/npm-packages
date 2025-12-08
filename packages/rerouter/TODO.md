- Remove the `$` before `$get()`, `$post()`, etc.
- Allow custom "ApiClient" name (`--name`)
- Change URL pattern to name convention
  - `/books/:id` should become "BooksById"
  - `/books/:year/:month` should become "BooksByYearByMonth"
  - `/books/:year(\d+)/:month` should also be "BooksByYearByMonth"
  - `/books/:year/categories/:category` should become "BooksByYearCategoriesByCategory"
- Allow adding custom import headers
  - `--import-type "NeverjectPromise:neverject"` adds `import type { NeverjectPromise } from 'neverject'`
  - `--import-type "Foo,Bar:@org/baz` adds `import type { Foo, Bar } from '@org/baz'`
  - This is repeatable for multiple imports
- Allow specifying custom interface
  - `--client-type-params "TErr"` will add `<TErr>` to both `Fetcher` and `ApiClient`
  - `--fetch-type-params "TOk"` 
  - `--fetch-return-type "NeverjectPromise<OkResponse<TOk>,TErr>`


All together:

```sh
bun v2/gen-api-client.ts v2/router-instance.ts v2/dist/api-client.gen.ts \
  --import-type "NeverjectPromise:neverject" \
  --client-type-params "TErr" \
  --fetch-type-params "TOk" \
  --fetch-return-type "NeverjectPromise<OkResponse<TOk>,TErr>"
```

Should generate:

```ts
import type { NeverjectPromise } from 'neverject'

export interface Fetcher<TErr> {
    fetch<TOk>(url: string, init: RequestInit): NeverjectPromise<OkResponse<TOk>, TErr>
}

...

export class ApiClient<TErr> {
    constructor(private readonly fetcher: Fetcher<TErr>) {}

    ...
}
```
