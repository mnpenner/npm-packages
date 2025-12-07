import { defineConfig } from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        aggregate: 'src/aggregate/index.ts',
        invoke: 'src/invoke/index.ts',
        result: 'src/result/index.ts',
    },
    platform: 'neutral',
    format: ['esm'],
    external: [/^(node|bun):/],
    exports: true,
    dts: true,
})
