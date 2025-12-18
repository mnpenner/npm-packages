# README

## Usage

```sh
bun "packages/server-router/gen-api-client.ts" "packages/server-router/src/examples/router-instance.ts" "v2/dist/api-client.gen.ts" --client-name CustomApiClient --import-type CustomPromise:./api.ts --response-type CustomPromise
```

```ts
import {CustomApiClient, type Fetcher} from './api-client.gen'

class BasicFetcher implements Fetcher {
    constructor(private readonly baseUrl: string) {}

    fetch(url: string, init: RequestInit) {
        return fetch(new URL(url, this.baseUrl), init)
    }
}

const client = new CustomApiClient(new BasicFetcher(`http://localhost:3000`))
```

## Notes

- https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#modules
