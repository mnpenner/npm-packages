# neverject

Promises that never reject.

## API

### Functions & static methods

```ts
nj(5)  // AsyncResult<number, never>
nj(new Error("err"))  // AsyncResult<never, Error>
nj(Promise.resolve(5))  // AsyncResult<number, unknown>
nj(Promise.reject(5))  // AsyncResult<never, unknown>
nj(ok(5))  // AsyncResult<number, never>
nj(err(5))  // AsyncResult<never, number>
```

### Instance methods

#### AsyncResult

```ts
nj(Promise.resolve(5)).valueOr("fallback")  // AsyncResult<string|number, never>
nj(Promise.reject(5)).valueOr("fallback")  // AsyncResult<string, never>
nj(ok(5)).valueOr("fallback")  // AsyncResult<number, never>
nj(err(5)).valueOr("fallback")  // AsyncResult<string, never>
```

- `.map` is like `.then`
- `.catch` is like `.catch` -- the returned value defaults to `Ok` 
- `.mapErr` is similar to `.catch` but the returned value defaults to `Err` instead of `Ok`
- `.mapResult` is the same as `.map` but takes a `SyncResult` instead of separated args

#### SyncResult

