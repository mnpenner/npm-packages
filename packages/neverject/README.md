# neverject

Promises that never reject.

## API

### Constructors & helpers

- `ok`
- `err`

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
all({
    user: nj(fetchUser()),
    posts: nj(fetchPosts()),
})
// => AsyncResult<{ user: SyncResult<User, E1>; posts: SyncResult<Post[], E2> }, never>
// avoids array index juggling; each property stays keyed
```

Takes a record of `AsyncResult`/Promise/value inputs, normalizes each via `nj`, waits for all, and returns a
never-rejecting `AsyncResult` whose value is a record of per-key `SyncResult`.
Example:

```ts
const settled = await all({user: nj(fetchUser()), posts: nj(fetchPosts())})
// settled.ok is always true here; inspect each entry:
const user = settled.value.user
if(user.ok) {
    renderUser(user.value)
}
```

- `wrapFn`
- `wrapAsyncFn`

### Instance methods (target API)

Two shapes are central: `AsyncResult<V, E>` (Promise-like, never rejects) and `SyncResult<V, E>` (an `Ok`/`Err` tagged
union). The lists below describe the instance surface you probably want to expose/implement.

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

## Comparison with neverthrow

| neverthrow                                        | neverject                                   | Notes                                                                                           |
|---------------------------------------------------|---------------------------------------------|-------------------------------------------------------------------------------------------------|
| `ok(…)`                                           | `ok(…)`                                     | Create an Ok result                                                                             |
| `err(…)`                                          | `err(…)`                                    | Create an Err result                                                                            |
| `result.isOk()`                                   | `result.ok`                             | Ok check (property vs method)                                                                   |
| `result.isErr()`                                  | `!result.ok`                            | Err check (property vs method)                                                                  |
| `result.map(…)`                                   | `result.map(…)`                         | Transform Ok; second arg can transform Err                                                      |
| `result.mapErr(…)`                                | `result.mapErr(…)`                      | Transform Err                                                                                   |
| `result.unwrapOr(…)`                              | `result.valueOr(…)`                     | Provide a fallback value                                                                       |
| `result.andThen(…)`                               | `result.map(…)`                         | Neverject flattens returned Results, covering `andThen`                                         |
| `result.asyncAndThen(…)`                          | `result.toAsync().map(…)`               | Convert to async and flatten a ResultAsync-returning callback                                   |
| `result.orElse(…)`                                | `result.recover(…)`                     | Recover from an error by producing an Ok                                                        |
| `result.match(…)`                                 | `result.map(…)`                         | Handle both branches (returns SyncResult, not a raw value)                                      |
| `result.asyncMap(…)`                              | `result.toAsync().map(…)`               | Async mapping                                                                                    |
| `result.andTee(…)`                                | `result.tap(…)`                         | Side effects on success without changing the result                                             |
| `result.orTee(…)`                                 | `result.tapErr(…)`                      | Side effects on failure without changing the result                                             |
| `result.andThrough(…)`                            | ❌                                            | No direct pass-through that can change error type                                               |
| `result.asyncAndThrough(…)`                       | ❌                                            | No direct async pass-through equivalent                                                         |
| `Result.fromThrowable(…)`                         | `wrapFn(…)`                                 | Wrap a sync function so it returns a SyncResult                                                 |
| `Result.combine(…)`                               | `all(…)`                                    | Aggregate many results                                                                          |
| `Result.combineWithAllErrors(…)`                  | `all(…)`                                    | Aggregate many results without short-circuiting                                                 |
| ~~`Result.safeUnwrap()`~~                         | —                                            | Deprecated safe unwrap helper                                                                   |
| `okAsync(…)`                                      | `nj(…)`                                     | Create an Ok async result                                                                       |
| `errAsync(…)`                                     | `nj(…)`                                     | Create an Err async result                                                                      |
| `ResultAsync.fromThrowable(…)`                    | `wrapAsyncFn(…)`                            | Wrap an async function so it returns an AsyncResult                                             |
| `ResultAsync.fromPromise(…)`                      | `nj(…)`                                     | Wrap a promise into AsyncResult                                                                 |
| `ResultAsync.fromSafePromise(…)`                  | `nj(…)`                                     | Wrap a promise into AsyncResult (safe)                                                          |
| `resultAsync.map(…)`                              | `asyncResult.map(…)`                        | Transform Ok; second arg can transform Err                                                      |
| `resultAsync.mapErr(…)`                           | `asyncResult.mapErr(…)`                     | Transform Err                                                                                   |
| `resultAsync.unwrapOr(…)`                         | `asyncResult.valueOr(…)`                    | Provide a fallback value                                                                       |
| `resultAsync.andThen(…)`                          | `asyncResult.map(…)`                        | Neverject flattens returned Results                                                             |
| `resultAsync.orElse(…)`                           | `asyncResult.recover(…)`                    | Recover from an error by producing an Ok                                                        |
| `resultAsync.match(…)`                            | `asyncResult.map(…)`                        | Handle both branches (returns AsyncResult)                                                      |
| `resultAsync.andTee(…)`                           | `asyncResult.tap(…)`                        | Side effects on success without changing the result                                             |
| `resultAsync.orTee(…)`                            | `asyncResult.tapErr(…)`                     | Side effects on failure without changing the result                                             |
| `resultAsync.andThrough(…)`                       | ❌                                            | No direct async pass-through equivalent                                                         |
| `ResultAsync.combine(…)`                          | `all(…)`                                    | Aggregate many async results                                                                    |
| `ResultAsync.combineWithAllErrors(…)`             | `all(…)`                                    | Aggregate many async results without short-circuiting                                           |
| ~~`ResultAsync.safeUnwrap()`~~                      | —                                            | Deprecated safe unwrap helper                                                                   |
| `fromThrowable(…)`                                | `wrapFn(…)`                                 | Top-level helper covered by `wrapFn`                                                            |
| `fromAsyncThrowable(…)`                           | `wrapAsyncFn(…)`                            | Top-level helper covered by `wrapAsyncFn`                                                       |
| `fromPromise(…)`                                  | `nj(…)`                                     | Top-level helper covered by `nj`                                                                |
| `fromSafePromise(…)`                              | `nj(…)`                                     | Top-level helper covered by `nj`                                                                |
| `safeTry(…)`                                      | ❌                                            | Generator helper for early-returning on Err                                                     |
