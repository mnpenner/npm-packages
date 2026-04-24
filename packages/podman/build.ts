#!/usr/bin/env bun
import { rmSync } from 'node:fs'

const outdir = `${__dirname}/dist`

rmSync(outdir, { recursive: true, force: true })

await Bun.build({
  entrypoints: [`${__dirname}/src/index.ts`],
  outdir: outdir,
  target: 'bun',
  format: 'esm',
  minify: false,
  sourcemap: 'none',
})
