import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: { bundle: './src/index.ts' },
    platform: 'neutral',
    format: 'esm',
    dts: true,
    exports: {
        legacy: true,
    },
    clean: true,
})
