import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: { index: './src/color.ts' },
    platform: 'neutral',
    format: 'esm',
    exports: true,
    dts: true,
    clean: true,
})
