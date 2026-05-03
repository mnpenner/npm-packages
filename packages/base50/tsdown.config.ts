import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/bundle.ts'],
    format: 'esm',
    dts: true,
    exports: true,
    clean: true,
})
