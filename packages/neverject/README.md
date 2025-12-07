# neverject

Promises that never reject.

## Installation

```bash
npm install neverject
# or
bun add neverject
```

## Quick start

```ts
import {nj, err} from 'neverject'
import {wrapFn} from 'neverject/invoke'

// Normalize any promise so failures become Err<DetailedError>
const user = await nj(fetch('/api/user/1')).map(async (response) => {
    if(!response.ok) return err(new Error(`HTTP ${response.status}`))
    return response.json() as Promise<{ id: number; name: string }>
})
if(user.ok) console.log(user.value.name)
else console.error(user.error.message)

// Guard a throwable function without try/catch noise
const divide = wrapFn((a: number, b: number) => {
    if(b === 0) throw new Error('divide by zero')
    return a / b
})

const result = divide(12, 3)
console.log(result.ok ? result.value : result.error.message)
```

## Usage examples

- **Normalize anything**: `nj` wraps values, promises, and existing `Result` instances without ever rejecting.
  ```ts
  const resolved = await nj(Promise.resolve({id: 1}))
  const rejected = await nj(Promise.reject('offline'))
  console.log(resolved.ok) // true
  console.log(rejected.ok) // false; rejected.error.details === 'offline'
  ```

- **Combine in order**: stop on the first failure with `allOk` or `allOkRecord`.
  ```ts
  import {allOk, allOkRecord} from 'neverject/aggregate'

  const tuple = await allOk([nj('a'), nj(Promise.reject(new Error('x')))] as const)
  const record = await allOkRecord({user: nj({id: 1}), prefs: nj(err('missing'))})
  console.log(tuple.ok)  // false
  console.log(record.ok) // false
  ```

- **Inspect every attempt**: keep per-entry results with `allSettled` and `allSettledRecord`.
  ```ts
  import {allSettledRecord} from 'neverject/aggregate'

  const settled = await allSettledRecord({
      user: nj(fetch('/user')), // -> Ok(Response)
      profile: nj(err('missing profile')), // -> Err('missing profile')
  })
  if(settled.ok) {
      console.log(settled.value.profile.ok) // false
  }
  ```

- **Race for the first success**: `firstOk` (alias `any`) races attempts and returns the earliest `Ok` or every error
  when none succeed.
  ```ts
  import {any, firstOk} from 'neverject/aggregate'

  const winner = await any([
      nj(err('fail fast')),
      nj(Promise.resolve('wins')),
  ] as const)
  console.log(winner.ok ? winner.value : winner.error)
  ```

- **Wrap existing functions**: convert throwable sync/async functions into results.
  ```ts
  import {wrapFn, wrapAsyncFn, tryCallAsync} from 'neverject/invoke'

  const safeParse = wrapFn(JSON.parse, (reason) => ({message: String(reason)}))
  const parsed = safeParse('{"id":1}')

  const safeDivide = wrapAsyncFn(async (a: number, b: number) => {
      if(b === 0) throw 'div by zero'
      return a / b
  })

  const result = await tryCallAsync(async () => ok('works'))
  ```

## API reference

Types used below:

```ts
type Result<V, E> = Ok<V> | Err<E>
type Resultish<V, E> = Result<V, E> | NeverjectPromise<V, E> | PromiseLike<Result<V, E>> | V | PromiseLike<V>
type ResultValue<V, E> = V | Result<V, E> | NeverjectPromise<V, E> | PromiseLike<V | Result<V, E>>
type ResultError<V, E> = E | Result<V, E> | NeverjectPromise<V, E> | PromiseLike<E | Result<V, E>>
type MaybePromise<T> = T | PromiseLike<T>
type DetailedError<T = unknown> = Error & { details?: T }
```

### Core (`neverject`)

```ts
class Ok<T> {
    readonly ok: true

    constructor(value: T)

    readonly value: T

    valueOr<U>(defaultValue: U): T

    toString(): string
}

class Err<E> {
    readonly ok: false

    constructor(error: E)

    readonly error: E

    valueOr<U>(defaultValue: U): U

    toString(): string
}

class NeverjectPromise<V, E> implements PromiseLike<Result<V, E>> {
    private constructor(promise: PromiseLike<Result<V, E>>)

    static fromSafePromise<V, E>(promise: PromiseLike<Result<V, E>>): NeverjectPromise<V, E>

    then<TResult1 = Result<V, E>, TResult2 = never>(
        onfulfilled?: (value: Result<V, E>) => PromiseLike<TResult1> | TResult1,
        onrejected?: (reason: any) => PromiseLike<TResult2> | TResult2
    ): PromiseLike<TResult1 | TResult2>

    map<NV, NE = E>(
        onfulfilled: (value: V) => ResultValue<NV, NE>,
        onrejected?: (error: E) => ResultValue<NV, NE>
    ): NeverjectPromise<NV, E | NE>

    mapErr<NE>(fn: (error: E) => ResultError<V, NE>): NeverjectPromise<V, NE>

    recover<NE>(fn: (error: E) => Err<NE> | NeverjectPromise<never, NE> | MaybePromise<Err<NE>>): NeverjectPromise<V, NE>
    recover<RV, NE>(fn: (error: E) => ResultValue<RV, NE>): NeverjectPromise<V | RV, NE>
    recover<RV>(fn: (error: E) => MaybePromise<RV>): NeverjectPromise<V | RV, never>

    mapResult<NV, NE = E>(fn: (result: Result<V, E>) => ResultValue<NV, NE>): NeverjectPromise<NV, NE>

    valueOr<U>(fallback: U | ((error: E) => U)): NeverjectPromise<V | U, never>

    tap(onfulfilled: (value: V) => MaybePromise<unknown>, onrejected?: (error: E) => MaybePromise<unknown>): NeverjectPromise<V, E>

    tapResult(fn: (result: Result<V, E>) => MaybePromise<unknown>): NeverjectPromise<V, E>

    tapErr(fn: (error: E) => MaybePromise<unknown>): NeverjectPromise<V, E>
}

function ok<T>(value: T): Ok<T>

function err<E>(error: E): Err<E>

function nj<P>(value: PromiseLike<P>): NeverjectPromise<Awaited<P> extends Result<infer V, any> ? V : Awaited<P>, Awaited<P> extends Result<any, infer E> ? E : DetailedError<unknown>>
function nj<E extends Error>(error: E): NeverjectPromise<never, E>
function nj<V>(result: Ok<V>): NeverjectPromise<V, never>
function nj<E>(result: Err<E>): NeverjectPromise<never, E>
function nj<V, E>(result: Result<V, E>): NeverjectPromise<V, E>
function nj<V>(value: V): NeverjectPromise<V, never>
function nj<P, E>(promise: PromiseLike<P>, errorFn: (e: unknown) => E): NeverjectPromise<Awaited<P>, E>
function nj<V, I, E>(result: Result<V, I>, errorFn: (e: I) => E): NeverjectPromise<V, E>
function nj<V, E>(value: V, errorFn: (e: unknown) => E): NeverjectPromise<V, E>
```

### Aggregation (`neverject/aggregate`)

```ts
type ToSyncResult<T> =
    T extends NeverjectPromise<infer V, infer E> ? Result<V, E> :
        T extends Ok<infer V2> ? Result<V2, never> :
            T extends Err<infer E2> ? Result<never, E2> :
                T extends Result<infer V3, infer E3> ? Result<V3, E3> :
                    T extends PromiseLike<infer P> ? (P extends Result<infer V4, infer E4> ? Result<V4, E4> : Result<Awaited<P>, DetailedError<unknown>>) :
                        Result<T, never>

type AllSettledArray<T extends readonly unknown[]> = { [K in keyof T]: ToSyncResult<T[K]> }
type AllSettledRecord<T extends Record<string, unknown>> = { [K in keyof T]: ToSyncResult<T[K]> }
type AllOkValues<T extends readonly unknown[]> = { [K in keyof T]: ToSyncResult<T[K]> extends Result<infer V, any> ? V : never }
type AllOkErrors<T extends readonly unknown[]> = ToSyncResult<T[number]> extends Result<any, infer E> ? E : never
type AllOkRecord<T extends Record<string, unknown>> = { [K in keyof T]: ToSyncResult<T[K]> extends Result<infer V, any> ? V : never }
type AllOkRecordErrors<T extends Record<string, unknown>> = ToSyncResult<T[keyof T]> extends Result<any, infer E> ? E : never

function allSettled<T extends readonly (NeverjectPromise<any, any> | MaybePromise<any>)[]>(inputs: T): NeverjectPromise<AllSettledArray<T>, never>

function allSettledRecord<T extends Record<string, NeverjectPromise<any, any> | MaybePromise<any>>>(inputs: T): NeverjectPromise<AllSettledRecord<T>, never>

function allOk<T extends readonly (NeverjectPromise<any, any> | MaybePromise<any>)[]>(inputs: T): NeverjectPromise<AllOkValues<T>, AllOkErrors<T>>

function allOkRecord<T extends Record<string, NeverjectPromise<any, any> | MaybePromise<any>>>(inputs: T): NeverjectPromise<AllOkRecord<T>, AllOkRecordErrors<T>>

type FirstInput = NeverjectPromise<any, any> | MaybePromise<any>
type FirstSettledValue<T extends readonly unknown[]> = ToSyncResult<T[number]> extends Result<infer V, any> ? V : never
type FirstSettledError<T extends readonly unknown[]> = ToSyncResult<T[number]> extends Result<any, infer E> ? E : never
type FirstOkValue<T extends readonly unknown[]> = ToSyncResult<T[number]> extends Result<infer V, any> ? V : never
type FirstOkError<T extends readonly unknown[]> = ToSyncResult<T[number]> extends Result<any, infer E> ? E : never

function firstSettled<T extends readonly [FirstInput, ...FirstInput[]]>(inputs: T): NeverjectPromise<FirstSettledValue<T>, FirstSettledError<T>>

function race<T extends readonly [FirstInput, ...FirstInput[]]>(inputs: T): NeverjectPromise<FirstSettledValue<T>, FirstSettledError<T>>

function firstOk<T extends readonly [FirstInput, ...FirstInput[]]>(inputs: T): NeverjectPromise<FirstOkValue<T>, FirstOkError<T>[]>

function any<T extends readonly [FirstInput, ...FirstInput[]]>(inputs: T): NeverjectPromise<FirstOkValue<T>, FirstOkError<T>[]>
```

### Invocation helpers (`neverject/invoke`)

```ts
function tryCall<A extends any[] = []>(fn: (...args: A) => never, ...args: A): Result<never, unknown>
function tryCall<V, A extends any[] = []>(fn: (...args: A) => Ok<V>, ...args: A): Result<V, never>
function tryCall<E, A extends any[] = []>(fn: (...args: A) => Err<E>, ...args: A): Result<never, E>
function tryCall<V, E, A extends any[] = []>(fn: (...args: A) => Result<V, E>, ...args: A): Result<V, E>
function tryCall<V, A extends any[] = []>(fn: (...args: A) => V, ...args: A): Result<V, DetailedError<unknown>>
function tryCall<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Result<V, E> | V, ...args: A): Result<V, E | DetailedError<unknown>>

function tryCallAsync<A extends any[] = []>(fn: (...args: A) => MaybePromise<never>, ...args: A): NeverjectPromise<never, DetailedError<unknown>>
function tryCallAsync<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<Ok<V>>, ...args: A): NeverjectPromise<V, never>
function tryCallAsync<E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Err<E>>, ...args: A): NeverjectPromise<never, E>
function tryCallAsync<V, E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E>>, ...args: A): NeverjectPromise<V, E>
function tryCallAsync<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<V>, ...args: A): NeverjectPromise<V, DetailedError<unknown>>
function tryCallAsync<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E> | V>, ...args: A): NeverjectPromise<V, E | DetailedError<unknown>>

type ErrorMapper<E> = (reason: unknown) => E

function wrapFn<A extends any[] = []>(fn: (...args: A) => never, onError?: ErrorMapper<unknown>): (...args: A) => Result<never, unknown>
function wrapFn<V, A extends any[] = []>(fn: (...args: A) => Ok<V>, onError?: ErrorMapper<unknown>): (...args: A) => Result<V, never>
function wrapFn<E, A extends any[] = []>(fn: (...args: A) => Err<E>, onError?: ErrorMapper<unknown>): (...args: A) => Result<never, E>
function wrapFn<V, E, A extends any[] = []>(fn: (...args: A) => Result<V, E>, onError?: ErrorMapper<E>): (...args: A) => Result<V, E>
function wrapFn<V, A extends any[] = []>(fn: (...args: A) => V, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => Result<V, DetailedError<unknown>>
function wrapFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => Result<V, E> | V, onError?: ErrorMapper<E>): (...args: A) => Result<V, E>

function wrapAsyncFn<A extends any[] = []>(fn: (...args: A) => MaybePromise<never>, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => NeverjectPromise<never, DetailedError<unknown>>
function wrapAsyncFn<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<Ok<V>>, onError?: ErrorMapper<never>): (...args: A) => NeverjectPromise<V, never>
function wrapAsyncFn<E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Err<E>>, onError?: ErrorMapper<unknown>): (...args: A) => NeverjectPromise<never, E>
function wrapAsyncFn<V, E, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E>>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E>
function wrapAsyncFn<V, A extends any[] = []>(fn: (...args: A) => MaybePromise<V>, onError?: ErrorMapper<DetailedError<unknown>>): (...args: A) => NeverjectPromise<V, DetailedError<unknown>>
function wrapAsyncFn<V, E = DetailedError<unknown>, A extends any[] = []>(fn: (...args: A) => MaybePromise<Result<V, E> | V>, onError?: ErrorMapper<E>): (...args: A) => NeverjectPromise<V, E>

function wrapSafeAsyncFn<V, E = never, A extends any[] = []>(fn: (...args: A) => PromiseLike<Result<V, E>>): (...args: A) => NeverjectPromise<V, E>
```

### Result helpers (`neverject/result`)

```ts
function resolve<V>(result: Ok<V>): Ok<V>
function resolve<E>(result: Err<E>): Err<E>
function resolve<V, E>(result: Result<V, E>): Result<V, E>
function resolve<V>(value: V): Ok<V>

function rejectWithError<V>(result: Ok<V>): Ok<V>
function rejectWithError<E>(result: Err<E>): Err<E>
function rejectWithError<V, E>(result: Result<V, E>): Result<V, E>
function rejectWithError<E extends Error>(reason: E): Err<E>
function rejectWithError<T>(reason: T): Err<DetailedError<T>>

function reject<V>(result: Ok<V>): Ok<V>
function reject<E>(result: Err<E>): Err<E>
function reject<V, E>(result: Result<V, E>): Result<V, E>
function reject<E>(reason: E): Err<E>

function isResult(x: unknown): x is Result<unknown, unknown>
```

## Comparison with neverthrow

| Capability                         | neverthrow                                                          | neverject                                  | Notes                                                                                 |
|------------------------------------|---------------------------------------------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------|
| Create success/error               | `ok`, `err`                                                         | `ok`, `err`                                | Identical constructors                                                                |
| Wrap promises into results         | `okAsync`, `errAsync`, `ResultAsync.fromPromise`, `fromSafePromise` | `nj`                                       | `nj` never rejects and flattens nested `Result` values                                |
| Adopt already-safe Result promises | `ResultAsync.fromSafePromise`                                       | `NeverjectPromise.fromSafePromise`         | Use when you guarantee the promise never rejects                                      |
| Wrap throwable sync functions      | `Result.fromThrowable`                                              | `wrapFn`, `tryCall`                        | `wrapFn` defers invocation; `tryCall` executes immediately                            |
| Wrap throwable async functions     | `ResultAsync.fromThrowable` / `fromAsyncThrowable`                  | `wrapAsyncFn`, `tryCallAsync`              | `wrapSafeAsyncFn` covers already-safe async results                                   |
| Aggregate until first error        | `ResultAsync.combine`                                               | `allOk`, `allOkRecord`                     | Short-circuits on the first `Err`                                                     |
| Aggregate and keep every outcome   | `ResultAsync.combineWithAllErrors`                                  | `allSettled`, `allSettledRecord`           | Returns `Ok` of per-entry `Result` values                                             |
| Race attempts                      | `ResultAsync.any`                                                   | `firstOk` / `any`, `firstSettled` / `race` | `firstOk` returns the first `Ok` or all errors; `firstSettled` mirrors `Promise.race` |
| Generator helpers (`safeTry`)      | `safeTry`                                                           | not provided                               | Use `tryCall` / `tryCallAsync` instead                                                |

## FAQ

### Where's the source code?

I use Mercurial, which GitHub doesn't support and Atlassian graciously dropped, so I self-host a private repo. If you
want to see the code, check the [Code tab on npm](https://www.npmjs.com/package/neverject?activeTab=code), which is
honestly better anyway, because what you see on GitHub isn't necessarily what you're installing anyway.

### How do I file an issue?

You can't.

### Why should I use neverject instead of neverthrow?

You really like me or you prefer the API.

### Why should I use neverthrow instead of neverject?

It's more popular, so it *might* already be integrated with libraries you use. It is also more battle-tested.
