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
allSettledObject({
    user: nj(fetchUser()),
    posts: nj(fetchPosts()),
})
// => AsyncResult<{ user: SyncResult<User, E1>; posts: SyncResult<Post[], E2> }, never>
// avoids array index juggling; each property stays keyed
```

`allSettledObject` takes a record of `AsyncResult`/Promise/value inputs, normalizes each via `nj`, waits for all, and
returns a
never-rejecting `AsyncResult` whose value is a record of per-key `SyncResult`.
Example:

```ts
const settled = await allSettledObject({user: nj(fetchUser()), posts: nj(fetchPosts())})
// settled.ok is always true here; inspect each entry:
const user = settled.value.user
if(user.ok) {
    renderUser(user.value)
}
```

```ts
const combined = await allOkObject({user: nj(fetchUser()), posts: nj(fetchPosts())})
// combined.ok is false on the first failing entry
```

Array variants are also available:

```ts
const settledArray = await allSettled([nj(fetchUser()), fetchPosts()])
const combinedArray = await allOk([nj(fetchUser()), fetchPosts()])
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

| neverthrow                                               | neverject                           | Notes                                                         |
|----------------------------------------------------------|-------------------------------------|---------------------------------------------------------------|
| Functions / static methods                               |                                     |                                                               |
| `ok(…)`                                                  | `ok(…)`                             | Create an Ok result                                           |
| `err(…)`                                                 | `err(…)`                            | Create an Err result                                          |
| `okAsync(…)`                                             | `nj(…)`                             | Create an Ok async result                                     |
| `errAsync(…)`                                            | `nj(…)`                             | Create an Err async result                                    |
| `ResultAsync.fromPromise(…)` / `fromPromise(…)`          | `nj(…)`                             | Wrap a promise into `AsyncResult`                             |
| `ResultAsync.fromSafePromise(…)` / `fromSafePromise(…)`  | `nj(…)`                             | Wrap a promise into `AsyncResult` (safe)                      |
| `Result.fromThrowable(…)` / `fromThrowable(…)`           | `wrapFn(…)`                         | Wrap a sync function so it returns a `SyncResult`             |
| `ResultAsync.fromThrowable(…)` / `fromAsyncThrowable(…)` | `wrapAsyncFn(…)`                    | Wrap an async function so it returns an `AsyncResult`         |
| `Result.combine(…)`                                      | ❌                                   | Aggregate values, short-circuit on Err                        |
| `Result.combineWithAllErrors(…)`                         | ❌                                   | Aggregate results, collecting both Ok/Err                     |
| `ResultAsync.combine(…)`                                 | `allOk(…)`,  `allOkObj(…)`          | Aggregate async values, short-circuit on Err                  |
| `ResultAsync.combineWithAllErrors(…)`                    | `allSettled(…)`, `allSettledObj(…)` | Aggregate async results into Ok list of SyncResults           |
| `safeTry(…)`                                             | TODO                                | Generator helper for early-returning on Err                   |
| Sync methods                                             |                                     |
| `result.isOk()`                                          | `syncResult.ok`                     | Ok check (property vs method)                                 |
| `result.isErr()`                                         | `!syncResult.ok`                    | Err check (property vs method)                                |
| `result.map(…)`                                          | `syncResult.map(…)`                 | Transform Ok; second arg can transform Err                    |
| `result.mapErr(…)`                                       | `syncResult.mapErr(…)`              | Transform Err                                                 |
| `result.unwrapOr(…)`                                     | `syncResult.valueOr(…)`             | Provide a fallback value                                      |
| `result.andThen(…)`                                      | `syncResult.map(…)`                 | Neverject flattens returned Results, covering `andThen`       |
| `result.asyncAndThen(…)`                                 | `syncResult.toAsync().map(…)`       | Convert to async and flatten a ResultAsync-returning callback |
| `result.orElse(…)`                                       | `syncResult.recover(…)`             | Recover from an error by producing an Ok                      |
| `result.match(…)`                                        | `syncResult.map(…)`                 | Handle both branches (returns SyncResult, not a raw value)    |
| `result.asyncMap(…)`                                     | `syncResult.toAsync().map(…)`       | Async mapping                                                 |
| `result.andTee(…)`                                       | `syncResult.tap(…)`                 | Side effects on success without changing the result           |
| `result.orTee(…)`                                        | `syncResult.tapErr(…)`              | Side effects on failure without changing the result           |
| `result.andThrough(…)`                                   | ❌                                   | No direct pass-through that can change error type             |
| `result.asyncAndThrough(…)`                              | ❌                                   | No direct async pass-through equivalent                       |
| Async methods                                            |                                     |
| `resultAsync.map(…)`                                     | `asyncResult.map(…)`                | Transform Ok; second arg can transform Err                    |
| `resultAsync.mapErr(…)`                                  | `asyncResult.mapErr(…)`             | Transform Err                                                 |
| `resultAsync.unwrapOr(…)`                                | `asyncResult.valueOr(…)`            | Provide a fallback value                                      |
| `resultAsync.andThen(…)`                                 | `asyncResult.map(…)`                | Neverject flattens returned Results                           |
| `resultAsync.orElse(…)`                                  | `asyncResult.recover(…)`            | Recover from an error by producing an Ok                      |
| `resultAsync.match(…)`                                   | `asyncResult.map(…)`                | Handle both branches (returns AsyncResult)                    |
| `resultAsync.andTee(…)`                                  | `asyncResult.tap(…)`                | Side effects on success without changing the result           |
| `resultAsync.orTee(…)`                                   | `asyncResult.tapErr(…)`             | Side effects on failure without changing the result           |
| `resultAsync.andThrough(…)`                              | ❌                                   | No direct async pass-through equivalent                       |
