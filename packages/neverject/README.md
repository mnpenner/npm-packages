# neverject

Promises that never reject.

## API

```ts
nj(5)  // AsyncResult<number, never>
nj(new Error("err"))  // AsyncResult<never, Error>
nj(Promise.resolve(5))  // AsyncResult<number, unknown>
nj(Promise.reject(5))  // AsyncResult<never, unknown>
nj(ok(5))  // AsyncResult<number, never>
nj(err(5))  // AsyncResult<never, number>

nj(Promise.resolve(5)).vaueOr("fallback")  // AsyncResult<string|number, never>
nj(Promise.reject(5)).vaueOr("fallback")  // AsyncResult<string, never>
```
