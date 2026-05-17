import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: './src/index.ts',
    platform: 'neutral',
    format: 'esm',
    exports: true,
    dts: true,
    clean: true,
    deps: {
        neverBundle: [/^@mpen\//],
    },
})
