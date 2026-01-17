// Do not modify this file. It was auto-generated with the following command:
// $ bun src/bin/gen-api-client.ts ./examples/router-instance.ts ./examples/api-client.gen.ts

export interface Fetcher {
    fetch(url: string, init: RequestInit): unknown
}

export type TypedResponse<T> = Response & { json(): Promise<T> }
export type PromisedResponse<T> = Promise<TypedResponse<T>>

export type GetGenResponse = unknown

export class ApiClient {
    constructor(private readonly fetcher: Fetcher) {}

    get gen(): ApiClient_Gen {
        return new ApiClient_Gen(this.fetcher)
    }
}

class ApiClient_Gen {
    constructor(private readonly fetcher: Fetcher) {}
    get() {
        return this.fetcher.fetch("/gen", {
            method: "GET",
        }) as PromisedResponse<GetGenResponse>
    }
}
