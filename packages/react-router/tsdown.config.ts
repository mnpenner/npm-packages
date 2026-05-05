import { defineConfig } from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        hooks: 'src/hooks/index.ts',
        bin: 'src/bin.ts',
    },
    format: 'esm',
    platform: 'browser',
    deps: {
        neverBundle: [/^(node|bun):/, 'react'],
    },
    exports: {
        legacy: true,
        bin: {
            'react-router': './src/bin.ts',
        },
    },
    dts: true, // The client must use "moduleResolution": "bundler", "node16" or "nodenext". "node" will not resolve the types properly.
})
