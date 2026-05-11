import { defineConfig } from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        client: 'src/client/index.ts',
        index: 'src/index.ts',
        'helpers/zod': 'src/helpers/zod/index.ts', // TODO: clean these up
        'lib/collections': 'src/lib/collections.ts',
        middleware: 'src/middleware/index.ts',
        'plugins/openapi': 'src/plugins/openapi/index.ts',
        response: 'src/response/index.ts',
        'response/simple': 'src/response/simple.ts',
        routes: 'src/routes/index.ts',
    },
    platform: 'node',
    format: ['esm'],
    deps: {
        neverBundle: [/^(node|bun):/],
    },
    exports: {
        legacy: true,
    },
    dts: true, // The client must use "moduleResolution": "bundler", "node16" or "nodenext". "node" will not resolve the types properly.
})
