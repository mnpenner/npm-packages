import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        'index': './src/index.node.ts',
        'node': './src/index.node.ts',
        'web': './src/index.web.ts',
    },

    format: 'esm',
    exports: true,
    clean: true,
    dts: true,
})

