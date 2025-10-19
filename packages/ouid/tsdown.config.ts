import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/index.ts'],
    // target: 'node20',  // https://nodejs.org/en/about/previous-releases
    platform: 'node',
    format: ['esm', 'cjs'],
    exports: true,
})
