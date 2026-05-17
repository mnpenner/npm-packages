# @mpen/http

Small TypeScript constants for HTTP methods, status codes, status text, common headers, and common content types.

## Installation

```bash
bun add @mpen/http
```

## Quick Start

```ts
import { HttpMethod, HttpStatus, StatusText } from '@mpen/http'
import { ContentType, HeaderName } from '@mpen/http/common'

const response = new Response(StatusText[HttpStatus.CREATED], {
    status: HttpStatus.CREATED,
    headers: {
        [HeaderName.CONTENT_TYPE]: ContentType.JSON,
    },
})

console.log(HttpMethod.POST)
// "POST"
```

## Headers and Content Types

Import common header names, content types, and media types directly from `@mpen/http/common`.

```ts
import { ContentType, HeaderName, MediaType } from '@mpen/http/common'

const headers = new Headers({
    [HeaderName.ACCEPT]: MediaType.JSON,
    [HeaderName.CONTENT_TYPE]: ContentType.JSON,
})
```

## API

```ts
const enum HttpMethod {
    GET = 'GET',
    HEAD = 'HEAD',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    CONNECT = 'CONNECT',
    OPTIONS = 'OPTIONS',
    TRACE = 'TRACE',
    PATCH = 'PATCH',
}

const enum HttpStatus {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    // Includes standard 1xx, 2xx, 3xx, 4xx, and 5xx status codes.
}

const StatusText: Record<HttpStatus, string>

namespace common {
    const enum HeaderName {}
    const enum ContentType {}
    const enum MediaType {}
}
```

## Notes

- `ContentType` values include common charset parameters when appropriate.
- `MediaType` values contain only the media type without parameters.
- Deprecated root-entry aliases `CommonContentTypes`, `CommonHeaders`, and `CommonMediaTypes` remain available for older code.
