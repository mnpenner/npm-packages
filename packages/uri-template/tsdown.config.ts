import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: { bundle: './src/index.ts' },
    format: 'esm',
    dts: true,
    exports: true,
    clean: true,
})
