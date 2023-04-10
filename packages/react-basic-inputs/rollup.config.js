import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const production = !process.env.ROLLUP_WATCH;

const input = [
    "src/index.ts",
]
const output = [
    {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].mjs',
    },
]
const plugins = [
    nodeResolve(),
    commonjs(),
    typescript(),
    replace({
        preventAssignment: true,
        values: {
            'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
        },
    }),
]

if(production) {
    output.push({
        dir: 'dist',
        format: 'cjs',
        entryFileNames: '[name].cjs',
    })
    plugins.push(terser({
        format: {
            comments: 'some',
            beautify: true,
            ecma: '2022',
        },
        compress: false,
        mangle: false,
        module: true,
    }))
} else {
    input.push('src/dev.tsx')
}

export default {
    input,
    output,
    plugins,
    context: 'globalThis',
}
