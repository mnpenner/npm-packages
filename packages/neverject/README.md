# neverject

Promises that never reject.

## API

### Constructors & helpers

- `ok`
- `err`

```ts
nj(5)  // NeverjectPromise<number, never>
nj(new Error("err"))  // NeverjectPromise<never, Error>
nj(Promise.resolve(5))  // NeverjectPromise<number, unknown>
nj(Promise.reject(5))  // NeverjectPromise<never, unknown>
nj(ok(5))  // NeverjectPromise<number, never>
nj(err(5))  // NeverjectPromise<never, number>
```

### Util

```ts
allSettledRecord({
    user: nj(fetchUser()),
    posts: nj(fetchPosts()),
})
// => NeverjectPromise<{ user: Result<User, E1>; posts: Result<Post[], E2> }, never>
// avoids array index juggling; each property stays keyed
```

`allSettledRecord` takes a record of `NeverjectPromise`/Promise/value inputs, normalizes each via `nj`, waits for all,
and
returns a
never-rejecting `NeverjectPromise` whose value is a record of per-key `Result`.
Example:

```ts
const settled = await allSettledRecord({user: nj(fetchUser()), posts: nj(fetchPosts())})
// settled.ok is always true here; inspect each entry:
const user = settled.value.user
if(user.ok) {
    renderUser(user.value)
}
```

```ts
const combined = await allOkRecord({user: nj(fetchUser()), posts: nj(fetchPosts())})
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

Two shapes are central: `NeverjectPromise<V, E>` (Promise-like, never rejects) and `Result<V, E>` (an `Ok`/`Err`
tagged
union). The lists below describe the instance surface you probably want to expose/implement.

#### NeverjectPromise

- `then(onfulfilled, onrejected?)` — PromiseLike entry point that never rejects; rejections become `NeverjectError`.
- `map(fn)` — transform the `Ok` value; keeps the same error type.
- `mapErr(fn)` — transform the `Err` value; keeps the same ok type. Returning a bare value is treated as the new error (`Err(value)`); returning `Ok/Err/NeverjectPromise` is flattened.
- `mapResult(fn)` — give callers access to the whole `Result` and expect a `Result` back.
- `valueOr(fallback | (e) => fallback)` — resolve to the ok value or a fallback when err, always returning `Ok` (the error type becomes `never`).
- `tap(fn)` / `tapErr(fn)` — side effects on success/failure without changing the value.
- `tapResult(fn)` — side-effect with the whole `Result` while returning it unchanged.
- `recover(fn)` — handle an error; you can return a value to recover (bare values become `Ok`), or return `Err`/`Result`/`NeverjectPromise` to keep failing. `mapErr` stays on the error branch for bare values; `recover` defaults to fixing the error.

#### Result

- `ok` boolean + `value` or `error` payload.
- `valueOr(fallback)` — return ok value or the fallback.
- `map(fn)` — return a new `Ok` with a transformed value.
- `mapErr(fn)` — return a new `Err` with a transformed error.
- `mapResult(fn)` — rewrite the result in one go.
- `tap(fn)` / `tapErr(fn)` — run side effects without altering the result.
- `toAsync()` — wrap in `NeverjectPromise` for promise-like composition.
- `recover(fn)` — handle an error and turn it into an `Ok` value (leaves existing `Ok` values untouched).
- `tapResult(fn)` — side-effect with the whole `Result` while returning it unchanged.

## Comparison with neverthrow

| neverthrow                                               | neverject                           | Notes                                                         |
|----------------------------------------------------------|-------------------------------------|---------------------------------------------------------------|
| Functions / static methods                               |                                     |                                                               |
| `ok(…)`                                                  | `ok(…)`                             | Create an Ok result                                           |
| `err(…)`                                                 | `err(…)`                            | Create an Err result                                          |
| `okAsync(…)`                                             | `nj(…)`                             | Create an Ok async result                                     |
| `errAsync(…)`                                            | `nj(…)`                             | Create an Err async result                                    |
| `ResultAsync.fromPromise(…)` / `fromPromise(…)`          | `nj(…)`                             | Wrap a promise into `NeverjectPromise`                        |
| `ResultAsync.fromSafePromise(…)` / `fromSafePromise(…)`  | `nj(…)`                             | Wrap a promise into `NeverjectPromise` (safe)                 |
| `Result.fromThrowable(…)` / `fromThrowable(…)`           | `wrapFn(…)`                         | Wrap a sync function so it returns a `Result`                 |
| `ResultAsync.fromThrowable(…)` / `fromAsyncThrowable(…)` | `wrapAsyncFn(…)`                    | Wrap an async function so it returns an `NeverjectPromise`    |
| `Result.combine(…)`                                      | ❌                                   | Aggregate values, short-circuit on Err                        |
| `Result.combineWithAllErrors(…)`                         | ❌                                   | Aggregate results, collecting both Ok/Err                     |
| `ResultAsync.combine(…)`                                 | `allOk(…)`,  `allOkRecord(…)`       | Aggregate async values, short-circuit on Err                  |
| `ResultAsync.combineWithAllErrors(…)`                    | `allSettled(…)`, `allSettledRecord(…)` | Aggregate async results into Ok list of SyncResults           |
| ❌                                                        | `anyOk(…)`                          | Like `Promise.any`                                            |                          
| ❌                                                        | `race(…)`                           | Like `Promise.race`                                           |                          
| `safeTry(…)`                                             | ❌                                   | Generator helper for early-returning on Err                   |
| ❌                                                        | `resolve(fn, …)`                    | Try calling fn, resolve to `Ok` or `Err`                      |                          
| ❌                                                        | `resolveAsync(fn, …)`               | Like `Promise.try`                                            |                          
| Sync methods                                             |                                     |
| `result.isOk()`                                          | `result.ok`                         | Ok check (property vs method)                                 |
| `result.isErr()`                                         | `!result.ok`                        | Err check (property vs method)                                |
| `result.map(…)`                                          | `result.map(…)`                     | Transform Ok; second arg can transform Err                    |
| `result.mapErr(…)`                                       | `result.mapErr(…)`                  | Transform Err                                                 |
| `result.unwrapOr(…)`                                     | `result.valueOr(…)`                 | Provide a fallback value                                      |
| `result.andThen(…)`                                      | `result.map(…)`                     | Neverject flattens returned Results, covering `andThen`       |
| `result.asyncAndThen(…)`                                 | `result.toAsync().map(…)`           | Convert to async and flatten a ResultAsync-returning callback |
| `result.orElse(…)`                                       | `result.recover(…)`                 | Recover from an error by producing an Ok                      |
| `result.match(…)`                                        | `result.map(…)`                     | Handle both branches (returns Result, not a raw value)        |
| `result.asyncMap(…)`                                     | `result.toAsync().map(…)`           | Async mapping                                                 |
| `result.andTee(…)`                                       | `result.tap(…)`                     | Side effects on success without changing the result           |
| `result.orTee(…)`                                        | `result.tapErr(…)`                  | Side effects on failure without changing the result           |
| `result.andThrough(…)`                                   | ❌                                   | No direct pass-through that can change error type             |
| `result.asyncAndThrough(…)`                              | ❌                                   | No direct async pass-through equivalent                       |
| Async methods                                            |                                     |
| `resultAsync.map(…)`                                     | `neverjectPromise.map(…)`           | Transform Ok; second arg can transform Err                    |
| `resultAsync.mapErr(…)`                                  | `neverjectPromise.mapErr(…)`        | Transform Err                                                 |
| `resultAsync.unwrapOr(…)`                                | `neverjectPromise.valueOr(…)`       | Provide a fallback value                                      |
| `resultAsync.andThen(…)`                                 | `neverjectPromise.map(…)`           | Neverject flattens returned Results                           |
| `resultAsync.orElse(…)`                                  | `neverjectPromise.recover(…)`       | Recover from an error by producing an Ok                      |
| `resultAsync.match(…)`                                   | `neverjectPromise.map(…)`           | Handle both branches (returns NeverjectPromise)               |
| `resultAsync.andTee(…)`                                  | `neverjectPromise.tap(…)`           | Side effects on success without changing the result           |
| `resultAsync.orTee(…)`                                   | `neverjectPromise.tapErr(…)`        | Side effects on failure without changing the result           |
| `resultAsync.andThrough(…)`                              | ❌                                   | No direct async pass-through equivalent                       |


## FAQ

### Where's the source code?

I use Mercurial, which GitHub doesn't support and Atlassian graciously dropped, so I self-host a private repo. If you want to see the code, check the [Code tab on npm](https://www.npmjs.com/package/neverject?activeTab=code), which is honestly better anyway, because what you see on GitHub isn't necessarily what you're installing anyway.

### How do I file an issue?

You can't.

### Why should I use neverject instead of neverthrow?

You really like me or you prefer the API.

### Why should I use neverthrow instead of neverject?

It's more popular, so it *might* already be integrated with libraries you use. It is also more battle-tested.
