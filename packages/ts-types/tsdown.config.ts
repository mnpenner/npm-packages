import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        react: 'src/react.ts',
    },
    platform: 'neutral',
    exports: {
        legacy: true,
    },
    dts: true,
    format: 'esm',
    clean: true,
})
