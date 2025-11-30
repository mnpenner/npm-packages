import { defineConfig } from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        main: 'src/index.ts',
        util: 'src/util/index.ts',
    },
    // target: 'node20',  // https://nodejs.org/en/about/previous-releases
    platform: 'neutral',
    format: ['esm', 'cjs'],
    exports: true,
})
