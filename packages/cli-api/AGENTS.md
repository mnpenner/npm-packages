# Project

- This project may be referred to as either "clap" or "cli-api"
- This project is a CLI framework that simplifies building command-line tools. It handles argument parsing, help text generation, and other common tasks.

# Rules

- Use `expectType<TypeEqual<typeof VALUE, EXPECTED_TYPE>>(true)` to assert exact types in tests.
- Add detailed JSDoc comments including @param and @returns to all public APIs (exported from `src/index.ts`), including
  all function overloads
    - Link to other functions and classes using this syntax: [`exampleFunc`]{@link exampleFunc}
    - Link to methods using this syntax: [`Class.method`]{@link Class#method}
- This repo uses hg for version control
- Add a test to prevent regressions every time the user reports a bug or error
- Prefix private props with _
- All tests should be in a `describe(func.name, () => ...` block. Class methods should be in a `describe(Class.name,`
  block with the methods nested underneath.
- Don't delete files that aren't under version control. Use `hg rm` to delete files that are.
