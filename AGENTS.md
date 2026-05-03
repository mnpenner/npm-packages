- Use bun as a package manager and test runner
- Use tsdown w/ `{exports: true, dts: true, format: 'esm'}` to build
- Use typescript 6
- Target esnext/bundler/module
- This is a Mercurial repo that is also pushed to GitHub via Hg-Git
- For new packages, update the root `tsconfig.json` and `eslint.config.ts` as needed
- Add detailed [TSDoc](https://tsdoc.org) comments including @example blocks, @param and @returns to all public APIs,
  including all function overloads
    - The public API is the `entry` point(s) listed in `tsdown.config.ts`
    - Link to other functions and classes using this syntax: [`exampleFunc`]{@link exampleFunc}
    - Link to methods using this syntax: [`Class.method`]{@link Class#method}
    - Put an empty line between the description and the `@tags`
    - Mark items that are `export`ed but not public as `@internal`
- Use `templates/script-template.ts` for new scripts
- If you encounter a tsconfig deprecation error, don't add `'"ignoreDeprecations": "6.0"` to `tsconfig.json` -- figure
  out how to avoid the issue so that we are compatible with TypeScript 7.0
- If you need to write a temporary file, put it in `scratch/`
