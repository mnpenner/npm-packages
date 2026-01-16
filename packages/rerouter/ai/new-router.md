in packages/server-router/src/router.ts, simplify fetch(). in packages/server-router/src/types.ts, the Handler should take as an argument
an interface {req:Request} and return Promise<Response>|Response|AsyncGenerator<number|HttpStatus|Headers,Buffer|Uint8Array|ReadableStream>, *however* we need to keep the Type
params for packages/server-router/src/bin/gen-api-client.ts. even if fetch() doesn't use them, the user needs to be able to specify them
for type inference.

if fetch() receives a HEAD request and the handler returns an AsyncGenerator then it should iterate until the status and Headers are yielded (number should be interpretted as an http status). When those two things are yielded the generator should be closed and the headers should be sent to the client.

Similarly, if the request is aborted then the generator should be closed and no response should be sent.

The final return value from the generator should be interpretted as the body.

If a full Response is returned, then use that.
