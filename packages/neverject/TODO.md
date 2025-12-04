# TODO

- Integrate [TypeDoc](https://typedoc.org)

## Notes

- `safeTry`
    - [docs](https://github.com/supermacro/neverthrow?tab=readme-ov-file#safetry)
    - [impl](https://github.com/supermacro/neverthrow/blob/de73e225d76bddadec1f2e1c86ec91996f8087a9/src/result.ts#L77-L121)



---

- I think we need safe and unsafe versions of all the NeverjectPromise methods. Right now I changed them to assume the mapped functions are safe (will never throw) so that it doesn't mess up the return types. But means you can never throw inside the callback functions... but maybe that's OK because it's trivial to call unsafe promises with nj() or callAsync.

What should you do if you're writing a brand new function and want to return an NeverjectPromise?

```ts
function mySafeAsyncFunction(arg: string): NeverjectPromise<number, Error> {
    return nj(Math.random() < 0.5 ? err(new Error('oops')) : ok(arg.length))
}
```

We didn't need all the error catching that nj provides here. Could try something like...


```ts
const mySafeAsyncFunction2 = wrapAsyncFn<string, Error>(async (arg: number) => {
    
})
```

But this is doing too much work too. we need safeNj and wrapSafeAsyncFn. We don't need wrapSafeFn because safe functions can just return Ok or Err and it'll be inferred properly.
