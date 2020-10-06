import babel from '@rollup/plugin-babel';
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
            include: 'src/**',
            extensions,
            comments: false,
            babelHelpers: 'bundled', // https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
        }),
    ],
    output: {
        banner: '#!/usr/bin/env node',
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
    },
}
