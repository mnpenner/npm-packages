import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/bundle.ts'],
    platform: 'node',
    format: 'esm',
    dts: true,
    exports: {
        legacy: true,
    },
    clean: true,
})
