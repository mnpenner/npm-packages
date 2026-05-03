import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        react: 'src/react.tsx',
    },
    exports: true,
    dts: true,
    format: ['esm'],
    deps: {
        neverBundle: ['react'],
    },
})
