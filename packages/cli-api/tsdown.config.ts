import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/index.ts'],
    format: ['esm'],
    dts: true,
    platform: 'node',
    outDir: 'dist',
    clean: true,
    publint: 'ci-only',
})
