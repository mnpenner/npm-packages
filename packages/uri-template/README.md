# @mpen/uri-template

RFC 6570 URI template expansion with a small matcher for routing-style URL parsing.

## Installation

```bash
bun add @mpen/uri-template
```

## Quick Start

```ts
import { UriTemplate } from '@mpen/uri-template'

const userUrl = new UriTemplate<{ id: number; tab: string }>('/users/{id}{?tab}')

console.log(userUrl.expand({ id: 42, tab: 'settings' }))
// "/users/42?tab=settings"

console.log(userUrl.match('/users/42?tab=settings')?.params)
// { id: "42", tab: "settings" }
```

## Expanding Templates

`UriTemplate.expand` supports the standard RFC 6570 operators for simple values, reserved values, fragments, path segments, labels, path parameters, and query strings.

```ts
const vars = {
    base: 'https://example.com/home/',
    path: '/docs/uri templates',
    tags: ['routing', 'templates'],
    filter: {
        status: 'open',
        owner: 'mark',
    },
}

console.log(new UriTemplate('{+base}index').expand(vars))
// "https://example.com/home/index"

console.log(new UriTemplate('/search{?tags*}').expand(vars))
// "/search?tags=routing&tags=templates"

console.log(new UriTemplate('/issues{?filter*}').expand(vars))
// "/issues?status=open&owner=mark"
```

Template variables can be strings, numbers, booleans, nulls, arrays, key-value pairs, or objects.

```ts
import type { UriParams } from '@mpen/uri-template'

const params = {
    id: 123,
    include: ['profile', 'settings'],
    labels: {
        priority: 'high',
        state: 'open',
    },
} satisfies UriParams
```

## Matching URLs

`UriTemplate.match` returns `null` when the input does not match. On success it returns parsed `params` and a `score` that can be used to rank multiple route matches.

```ts
const route = new UriTemplate<{
    year: number
    month: number
    day: number
    query: Record<string, string>
}>('/schedule/{year:int:4}-{month:int:2}-{day:int:2}{?query*}')

const match = route.match('/schedule/2026-05-06?view=week')

console.log(match)
// {
//   score: 14,
//   params: {
//     year: 2026,
//     month: 5,
//     day: 6,
//     query: { view: "week" }
//   }
// }
```

The matcher also supports a custom `:int` variable function. Add a fixed width after the function when the URL segment should contain a specific number of digits.

```ts
const invoice = new UriTemplate('/invoices/{invoiceId:int:6}')

console.log(invoice.match('/invoices/000123')?.params)
// { invoiceId: 123 }

console.log(invoice.match('/invoices/abc123'))
// null
```

## API

```ts
class UriTemplate<P extends UriParams> {
    constructor(template: string)

    expand(variables: P): string

    match(url: string): UriMatch<P> | null
}

type UriParams = Record<string, UrlParamValue>

type UrlParamValue =
    | string
    | number
    | boolean
    | null
    | Array<string | number | boolean | null>
    | Array<[key: string, value: string | number | boolean | null]>
    | Record<string, string | number | boolean | null>

type UriMatch<P extends UriParams> = {
    score: number
    params: P
}
```

## Notes

- Expansion behavior is tested against the RFC 6570 examples and extended test fixtures.
- Matching is intentionally route-oriented and exact: extra query strings or fragments must be represented in the template.
- Matched values are decoded with `decodeURIComponent`.
- The `score` field is an implementation detail for ranking candidate route matches.
