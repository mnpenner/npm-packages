import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/bin.ts'],
    platform: 'node',
    format: ['esm'],
    dts: true,
    exports: {
        legacy: true,
        bin: {
            svg2fonts: './src/bin.ts',
        },
    },
    clean: true,
})
