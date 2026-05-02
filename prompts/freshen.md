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
