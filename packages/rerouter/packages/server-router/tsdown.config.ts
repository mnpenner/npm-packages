import {defineConfig} from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        middleware: 'src/middleware/index.ts',
    },
    platform: 'node',
    format: ['esm'],
    external: [/^(node|bun):/],
    exports: true,
    dts: true, // The client must use "moduleResolution": "bundler", "node16" or "nodenext". "node" will not resolve the types properly.
})

