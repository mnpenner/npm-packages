- Use bun as a package manager and test runner
- In Codex on Windows, prefer invoking Bun via PowerShell with `SystemRoot` set and the full Bun path, e.g.
  `$env:SystemRoot='C:\Windows'; & 'C:\Users\Mark\.bun\bin\bun.exe' run check`
    - Use this pattern for documented repo commands like `bun run check`, `bun run typecheck`, `bun run lint <files>`,
      `bun test`, and targeted script runs before assuming dependency resolution or Node/Bun typecheck failures are real
      repo failures.
    - Avoid plain `bun ...` / `node ...` validation commands in Codex when they fail with missing packages, `EPERM`
      under `C:\Users\Mark`, or other environment-shaped errors.
    - If that still fails with package resolution or filesystem permission errors, rerun the same command with
      escalation; sandboxed failures like "Cannot find package 'chalk'" can be false negatives.
- Use tsdown w/ `{exports: true, dts: true, format: 'esm'}` to build
- Use typescript 6
- If you encounter a tsconfig deprecation error, don't add `'"ignoreDeprecations": "6.0"` to `tsconfig.json` -- figure
  out how to avoid the issue so that we are compatible with TypeScript 7.0
- Target esnext/bundler/module
- This is a Mercurial (hg) repo. Do not try to run git commands.
    - Use `hg mv` to rename files (to maintain version history)
- For new packages, update the root `tsconfig.json` and `eslint.config.ts` as needed
    - `scripts/tspaths.ts` can be reused to refresh `paths` in `tsconfig.json`
- Add detailed [TSDoc](https://tsdoc.org) comments including @example blocks, @param and @returns to all public APIs
  (exported from the package), including all function overloads
    - Link to other functions and classes using this syntax: [`exampleFunc`]{@link exampleFunc}
    - Link to methods using this syntax: [`Class.method`]{@link Class#method}
    - Put an empty line between the description and the `@tags`
    - Mark items that are `export`ed but not public as `@internal`
- Use `templates/script-template.ts` for new scripts
- If you need to write a temporary file, put it in `scratch/`
- When causing an API break (e.g. renaming an existing function or property), ask the user if they want to deprecate and
  create an alias or just delete the old version. Most of these packages have little to no usage, so
  backwards-compatibility breaks are preferred for cleaner code.
- Keep the code tidy. Organize functions and classes into separate files. Rename things when they no longer make sense.
- All tests should be in a `describe(func.name, () => ...` block. Class methods should be in a `describe(Class.name,`
  block with the methods nested underneath.
- Add a test to prevent regressions whenever the user reports a bug or error
- Use `expectType<TypeEqual<typeof VALUE, EXPECTED_TYPE>>(true)` (from `@mpen/ts-types`) to assert exact types in tests.
