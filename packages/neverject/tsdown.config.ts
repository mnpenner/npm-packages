import { defineConfig } from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        util: 'src/util/index.ts',
    },
    platform: 'neutral',
    format: ['esm'],
    external: [/^(node|bun):/],
    exports: true,
    dts: true,
})
