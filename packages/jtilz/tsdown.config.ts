import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        index: './src/index.node.ts',
        node: './src/index.node.ts',
        web: './src/index.web.ts',
    },

    platform: 'node',
    format: 'esm',
    exports: {
        legacy: true,
    },
    clean: true,
    dts: true,
})
