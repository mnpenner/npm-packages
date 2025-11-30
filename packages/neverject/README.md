# neverject

Promises that never reject.

## API

### Constructors & helpers

```ts
nj(5)  // AsyncResult<number, never>
nj(new Error("err"))  // AsyncResult<never, Error>
nj(Promise.resolve(5))  // AsyncResult<number, unknown>
nj(Promise.reject(5))  // AsyncResult<never, unknown>
nj(ok(5))  // AsyncResult<number, never>
nj(err(5))  // AsyncResult<never, number>
```

### Util

```ts
allSettled(results: Record<string, AsyncResult>) => AsyncResult<Record<string, SyncResult>, never>  // Or is Promise<Record<string, SyncResult>> better? Or maybe a special OkAsyncResult?
```

### Instance methods (target API)

Two shapes are central: `AsyncResult<V, E>` (Promise-like, never rejects) and `SyncResult<V, E>` (an `Ok`/`Err` tagged union). The lists below describe the instance surface you probably want to expose/implement.

#### AsyncResult

- `then(onfulfilled, onrejected?)` — PromiseLike entry point that never rejects; rejections become `NeverjectError`.
- `map(fn)` — transform the `Ok` value; keeps the same error type.
- `mapErr(fn)` — transform the `Err` value; keeps the same ok type.
- `mapResult(fn)` — give callers access to the whole `SyncResult` and expect a `SyncResult` back.
- `valueOr(fallback | (e) => fallback)` — resolve to the ok value or a fallback when err.
- `tap(fn)` / `tapErr(fn)` — side effects on success/failure without changing the value.
- `tapResult(fn)` — side-effect with the whole `SyncResult` while returning it unchanged.
- `recover(fn)` — handle an error and turn it into an `Ok` value (leaves existing `Ok` values untouched).

#### SyncResult

- `ok` boolean + `value` or `error` payload.
- `valueOr(fallback)` — return ok value or the fallback.
- `map(fn)` — return a new `Ok` with a transformed value.
- `mapErr(fn)` — return a new `Err` with a transformed error.
- `mapResult(fn)` — rewrite the result in one go.
- `tap(fn)` / `tapErr(fn)` — run side effects without altering the result.
- `toAsync()` — wrap in `AsyncResult` for promise-like composition.
- `recover(fn)` — handle an error and turn it into an `Ok` value (leaves existing `Ok` values untouched).
- `tapResult(fn)` — side-effect with the whole `SyncResult` while returning it unchanged.
