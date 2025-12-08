Add an endpoint `/_batch`

Format is like

```ts
type Header = [name:string, value:string]

type BatchRequest = {
    headers: Header[]
    method: string // default "GET"
    body: unknown
}
```

If `body` is binary, the request can be sent as multipart. Each body will have to reference which multipart it is referring to;maybe with `bodyRef` instead.

The response is streamed with json-lines.

```json lines
{ index: 0, "status": 200, headers: [], "body": {} }
{ index: 1, "status": 200, headers: [], "body": {} }
```

The index is the order in which the requests were sent. The response may not be in the same order.

---

The ApiClient will need built-in support for this. The `Fetcher` need not know about it.

We should add some options to the ApiClient:

```ts
interface ClientOptions {
    /**
     * -1 means disable batching.
     * 0 means wait 1 tick.
     * >0 means number of milliseconds to wait for another incoming request
     */
    debounce: number
    /**
     * The maximum amount of time to wait before sending the batch request, since the first request was initiated.
     */
    maxWait: number
}
```

---

On the server, I think each sub-request should get its own request id, but it should be like "parentId.0", "parentId.1", etc.

We need to find away to avoid re-authenticating for each sub-request. Perhaps any routes that 'match everything' should only run once.

For other things, we have to be careful not to share the request context. Perhaps we should clone the request context for each sub-request.

