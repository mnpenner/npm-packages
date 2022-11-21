#!/usr/bin/env zx

$.cwd = `${__dirname}/..`
$.env.BABEL_ENV = 'production'

await $`rm -rf dist yarn-error.log`

await Promise.all([
    $`pnpm exec tsc --emitDeclarationOnly`,
    $`pnpm exec rollup -c`,
])
