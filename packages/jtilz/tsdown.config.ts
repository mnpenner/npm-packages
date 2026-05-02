import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        'index.node': './src/index.node.ts',
        'index.web': './src/index.web.ts',
    },
    format: 'esm',
    exports: true,
    clean: true,
    dts: true,
})
