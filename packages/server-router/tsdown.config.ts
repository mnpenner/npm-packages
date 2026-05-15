import { defineConfig } from 'tsdown'

// https://tsdown.dev/reference/api/Interface.UserConfig
export default defineConfig({
    entry: {
        client: 'src/client/index.ts',
        index: 'src/index.ts',
        handlers: 'src/router/handlers/index.ts',
        middleware: 'src/router/middleware/index.ts',
        routes: 'src/router/routes/index.ts',
        bin: 'bin/gen-api-client.ts',
    },
    platform: 'node',
    format: ['esm'],
    deps: {
        neverBundle: [/^(node|bun):/],
    },
    exports: {
        legacy: true,
        bin: {
            'server-router': 'bin/gen-api-client.ts',
        },
    },
    dts: true, // The client must use "moduleResolution": "bundler", "node16" or "nodenext". "node" will not resolve the types properly.
})
