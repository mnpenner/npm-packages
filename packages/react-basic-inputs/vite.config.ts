import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'node:path'
import dts from "vite-plugin-dts"


// https://vitejs.dev/config/
export default defineConfig({
    // https://github.com/qmhc/vite-plugin-dts/issues/281
    // root: 'src',
    // publicDir: '../public',

    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
        }),
    ],
    clearScreen: false,
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        }
    },
    // envDir: __dirname,

    // https://vitejs.dev/guide/build#library-mode
    build: {
        // outDir: '../dist',
        // emptyOutDir: true,
        minify: false,
        lib: {
            entry: resolve(__dirname, 'src/bundle.ts'),
            name: '@mpen/react-basic-inputs',
            fileName: 'react-basic-inputs',
        },
        rollupOptions: {
            // input: {
                // app: 'src/index.html',
            // },
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
            ],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    'react': 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'jsxRuntime',
                },
            },
        }
    },
})
