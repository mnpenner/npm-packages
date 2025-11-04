#!/usr/bin/env bun
import { rmSync } from 'node:fs'

const outdir = './dist'

rmSync(outdir, { recursive: true, force: true })

await Bun.build({
  entrypoints: ['./src/react-compiler.ts'],
  outdir: outdir,
  target: 'bun',
  format: 'esm',
  minify: false,
  sourcemap: 'none',
  external: ['@babel/core', 'babel-plugin-react-compiler'],
})
