Make scripts/publish.ts quieter.

For each package, as it's being checked, I don't need to see the lint and typecheck errors. Just print check or x (similar to scripts/test.ts) for each check. e.g.

static analysis
✓ lint
✓ types
✗ format
tests
✓ unit
✗ build
