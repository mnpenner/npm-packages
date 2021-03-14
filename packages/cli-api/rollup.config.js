import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodeExternals from 'rollup-plugin-node-externals'
import * as tsconfig from './tsconfig.json';
import * as pkg from './package.json'
import json from '@rollup/plugin-json';
const extensions = ['.ts'];

export default {
    input: tsconfig.files,
    plugins: [
        nodeResolve({
            extensions,
        }),
        nodeExternals({
            builtins: true,
            deps: true,
            devDeps: false,
            peerDeps: true,
            optDeps: true,
        }),
        json(),
        // TODO: change to typescript2 like node-mysql3c
        babel({
            exclude: 'node_modules/**',
            extensions,
            comments: false,
            babelHelpers: 'bundled',
        }),
    ],
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        {
            file: pkg.module,
            format: 'es',
            sourcemap: true,
        },
    ],
}
