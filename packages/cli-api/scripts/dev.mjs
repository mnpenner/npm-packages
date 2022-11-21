#!/usr/bin/env zx

$.cwd = `${__dirname}/..`
$.env.BABEL_ENV = 'development'

await $`pnpm exec rollup -cw`
