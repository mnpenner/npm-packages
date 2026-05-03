import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
    // https://github.com/qmhc/vite-plugin-dts/issues/281
    // root: 'src',
    // publicDir: '../public',

    server: {
        host: false,
    },
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler', { target: '19' }]],
            },
        }),
        dts({
            insertTypesEntry: true,
            rollupTypes: false,
        }),
    ],
    clearScreen: false,
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
    },
    esbuild: {
        minifyIdentifiers: false,
    },

    // envDir: __dirname,

    // https://vitejs.dev/guide/build#library-mode
    build: {
        // outDir: '../dist',
        // emptyOutDir: true,
        minify: false,
        lib: {
            entry: resolve(__dirname, 'src/bundle.ts'),
            formats: ['es'],
            fileName: 'react-basic-inputs',
        },
        rollupOptions: {
            // input: {
            // app: 'src/index.html',
            // },
            external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
    },
})
