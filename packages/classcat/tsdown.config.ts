import {defineConfig} from 'tsdown'

export default defineConfig({
    entry: ['./classcat.ts'],
    platform: 'neutral',
    format: ['esm'],
    dts: true,
    clean: true,
})
