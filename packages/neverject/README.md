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

| neverject                                              | neverthrow                                                                                                                      | Notes                                                                                                                      |
|--------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| `ok(…)`                                                | `ok(…)`                                                                                                                         | Create an `Ok` result                                                                                                      |
| `err(…)`                                               | `err(…)`                                                                                                                        | Create an `Err` result                                                                                                     |
| `nj(…)`                                                | `okAsync(…)` / `errAsync(…)` / `ResultAsync.fromPromise(…)` / `ResultAsync.fromSafePromise(…)` / `ResultAsync.fromThrowable(…)` | Wrapping helpers; both normalize sync/async values                                                                         |
| `asyncResult.then(…)`                                  | `resultAsync.then(…)`                                                                                                           | Both are thenable surfaces                                                                                                 |
| `asyncResult.map(…)` / `syncResult.map(…)`             | `resultAsync.map(…)` / `result.map(…)` / `resultAsync.match(…)` / `result.match(…)`                                             | Transform the `Ok` value; optional second arg transforms the `Err` value (neverthrow uses `match` for two-branch handling) |
| `asyncResult.mapErr(…)` / `syncResult.mapErr(…)`       | `resultAsync.mapErr(…)` / `result.mapErr(…)`                                                                                    | Transform the `Err` value                                                                                                  |
| `asyncResult.valueOr(…)` / `syncResult.valueOr(…)`     | `resultAsync.unwrapOr(…)` / `result.unwrapOr(…)`                                                                                | Provide a fallback value                                                                                                   |
| `asyncResult.recover(…)` / `syncResult.recover(…)`     | `resultAsync.orElse(…)` / `result.orElse(…)`                                                                                    | Recover from an error by producing an `Ok`                                                                                 |
| `asyncResult.tap(…)` / `syncResult.tap(…)`             | `resultAsync.andTee(…)` / `result.andTee(…)`                                                                                    | Side effects on success without changing the result                                                                        |
| `asyncResult.tapErr(…)` / `syncResult.tapErr(…)`       | `resultAsync.orTee(…)` / `result.orTee(…)`                                                                                      | Side effects on failure without changing the result                                                                        |
| `asyncResult.mapResult(…)` / `syncResult.mapResult(…)` | ❌                                                                                                                               | Rewrite the whole result shape                                                                                             |
| `asyncResult.tapResult(…)` / `syncResult.tapResult(…)` | ❌                                                                                                                               | Whole-result side-effect helper                                                                                            |
| `syncResult.toAsync()`                                 | ❌                                                                                                                               | Convert a sync result into an async result                                                                                 |
| `all(…)`                                               | `ResultAsync.combine(…)` / `ResultAsync.combineWithAllErrors(…)` / `Result.combine(…)` / `Result.combineWithAllErrors(…)`       | Aggregate many results                                                                                                     |
| `syncResult.ok`                                        | `result.isOk()`                                                                                                                 | Boolean Ok flag                                                                                                            |
| `!syncResult.ok`                                       | `result.isErr()`                                                                                                                | Boolean Err check                                                                                                          |
| ❌                                                      | `result.andThen(…)` / `resultAsync.andThen(…)`                                                                                  | Chain when the callback returns another Result                                                                             |
| ❌                                                      | `result.asyncAndThen(…)`                                                                                                        | Chain from sync Result into ResultAsync                                                                                    |
| ❌                                                      | `result.asyncMap(…)`                                                                                                            | Map with an async function (returns ResultAsync)                                                                           |
| ❌                                                      | `result.andThrough(…)` / `result.asyncAndThrough(…)`                                                                            | Pass-through side effects that may alter the error type                                                                    |
| ❌                                                      | `resultAsync.andThrough(…)`                                                                                                     | Async pass-through side effects that may alter the error type                                                              |
| ❌                                                      | `Result.fromThrowable(…)`                                                                                                       | Capture thrown errors into Result                                                                                          |
| ❌                                                      | `ResultAsync.fromPromise(…)` / `ResultAsync.fromSafePromise(…)` / `ResultAsync.fromThrowable(…)`                                | Wrap promises/throwables into ResultAsync                                                                                  |
| ❌                                                      | `fromThrowable(…)` / `fromAsyncThrowable(…)` / `fromPromise(…)` / `fromSafePromise(…)`                                          | Top-level utility exports that mirror the static helpers                                                                   |
| ❌                                                      | `Result.safeUnwrap()`                                                                                                           | Deprecated safe unwrap helper                                                                                              |
| ❌                                                      | `ResultAsync.safeUnwrap()`                                                                                                      | Deprecated safe unwrap helper                                                                                              |
| ❌                                                      | `_unsafeUnwrap(…)` / `_unsafeUnwrapErr(…)`                                                                                      | Test-only unsafe unwrapping                                                                                                |
| ❌                                                      | `safeTry(…)`                                                                                                                    | Generator helper for early-returning on Err                                                                                |
