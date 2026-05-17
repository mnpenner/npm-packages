import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: {
        index: './src/index.ts',
        browser: './src/loggers/browser.ts',
        json: './src/loggers/json.ts',
        terminal: './src/loggers/terminal.ts',
    },
    platform: 'neutral',
    format: 'esm',
    exports: true,
    dts: true,
    clean: true,
    deps: {
        neverBundle: [/^@mpen\/picocolors$/, /^bun$/],
    },
})
