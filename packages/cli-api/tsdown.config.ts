import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/index.ts'],
    format: ['esm'],
    dts: true,  // The client must use "moduleResolution": "bundler", "node16" or "nodenext". "node" will not resolve the types properly.
    platform: 'node',
    outDir: 'dist',
    clean: true,
    exports: true,  // https://tsdown.dev/options/package-exports#auto-generating-package-exports
    publint: 'ci-only',
    external: [/^(node|bun):/],
})
