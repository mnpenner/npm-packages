import babel from 'rollup-plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodeExternals from 'rollup-plugin-node-externals'
import * as tsconfig from './tsconfig.json';
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
        babel({
            exclude: 'node_modules/**',
            extensions,
            comments: false,
        }),
    ],
    output: [
        {
            dir: 'dist/cjs',
            format: 'cjs',
            sourcemap: true,
        },
        {
            dir: 'dist/es',
            format: 'es',
            sourcemap: true,
        },
    ],
}
