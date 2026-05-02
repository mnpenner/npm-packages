Freshen packages/jtilz

- convert from yarn to bun
- replace jest with bun test
- use tsdown to build the project; it needs to be compatible with both web and node/bun. so either make two different entrypoints that consumers somehow know which to use or make the package compatible with both
- get `bun run lint packages/jtilz` passing
- Add/update any missing doc comments
- Update/clean up package.json
- Bring README.md up to date
- Change test file naming to `file.test.ts`; get tests passing with `bun test`

---

Move any functions that are missing from packages/jtilz/src/Lang/is.ts to packages/is-type then delete packages/jtilz/src/Lang/is.ts. If there are slight discrepancies in the impl, choose the better one and report the difference to the user. Update the tests.

Deprecate any functions that have since been built-in to the language such as `flatten` and link to MDN.

Some symbols such as `SKIP` shouldn't be marked `@internal` I think -- the caller is expected to pass them into functions, no?

Is the README actually correct? Will `import {encodeParam} from 'jtilz';` work, or do we have to do import from` jtilz/index.node` or `jtilz/index.web` now? I want clean imports. If it's not possible, maek the two entry points `jtilz/node` and `jtilz/web` and make the README reflect that.

---

Add `isPromiseLike` to `is-type`; can use built-in `PromiseLike` type.

Deprecate `isNullish` in favor of `isNil`. If there are other duplicates, also deprecate them.

`clone` deprecate in favor of [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
