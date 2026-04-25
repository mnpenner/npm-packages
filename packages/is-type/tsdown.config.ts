import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/index.ts'],
    format: 'esm',
    exports: true,
    clean: true,
    dts: true,
})
