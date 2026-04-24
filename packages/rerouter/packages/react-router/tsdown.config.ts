import {defineConfig} from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        hooks: 'src/hooks/index.ts',
    },
    platform: 'browser',
    format: ['esm'],
    external: [/^(node|bun):/, 'react'],
    exports: true,
    dts: true, // The client must use "moduleResolution": "bundler", "node16" or "nodenext". "node" will not resolve the types properly.
})
