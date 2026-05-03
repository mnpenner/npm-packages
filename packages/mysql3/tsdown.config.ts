import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: './src/index.ts',
    platform: 'node',
    format: 'esm',
    exports: true,
    dts: true,
    clean: true,
    deps: {
        neverBundle: [/^(node|bun):/],
    },
})
