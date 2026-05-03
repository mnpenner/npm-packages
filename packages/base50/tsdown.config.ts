import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/bundle.ts'],
    format: 'esm',
    dts: true,
    exports: {
        legacy: true,
    },
    clean: true,
})
