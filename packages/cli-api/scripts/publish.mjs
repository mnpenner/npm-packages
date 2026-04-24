#!/usr/bin/env zx

$.cwd = `${__dirname}/..`

await $`pnpm publish`
