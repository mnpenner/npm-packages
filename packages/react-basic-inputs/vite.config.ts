import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import dts from "vite-plugin-dts";


// https://vitejs.dev/config/
export default defineConfig({
    root: 'src',
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
        }),
    ],
    clearScreen: false,

    // https://vitejs.dev/guide/build#library-mode
    build: {
        lib: {
            entry: resolve(__dirname, 'src/bundle.ts'),
            name: '@mpen/react-basic-inputs',
            fileName: 'react-basic-inputs',
        },
        rollupOptions: {
            external: ['react','react-dom'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    react: 'React',
                },
            },
        }
    },
})
