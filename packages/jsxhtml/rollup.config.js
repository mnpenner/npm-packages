import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import pkgJson from './package.json' assert {type: 'json'}

const production = !process.env.ROLLUP_WATCH;

/** @type {import('rollup').RollupOptions} */
const config = {
    input: `src/${production ? 'index.ts' : 'example.tsx'}`,
    output: [
        {
            dir: 'dist',
            format: 'esm',
            entryFileNames: '[name].mjs',
        },
    ],
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript(),
        replace({
            preventAssignment: true,
            values: {
                'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
            },
        }),
    ],
    context: 'globalThis',
}

if(production) {
    config.output.push({
        dir: 'dist',
        format: 'cjs',
        entryFileNames: '[name].cjs',
    })
    // config.external = new RegExp('^(' + Object.keys(pkgJson.peerDependencies).join('|') + ')($|/)')
    config.plugins.push(
        terser({
            format: {
                comments: 'some',
                beautify: true,
                ecma: '2022',
            },
            compress: false,
            mangle: false,
            module: true,
        }),
    )
}

export default config
