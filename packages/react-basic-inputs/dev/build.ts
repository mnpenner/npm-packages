import pkgJson from '../package.json' assert {type: 'json'}
import {BuildConfig} from 'bun'
import * as Path from 'node:path'

const production = true

const SRC_ROOT = `${import.meta.dir}/../src/`

// https://bun.sh/docs/bundler#reference
const config: BuildConfig = {
    outdir: `${import.meta.dir}/tmp`,
    format: "esm",
    naming: {
        entry: "[dir]/[name].mjs",
    },
    splitting: true,
    external: Object.keys(pkgJson.peerDependencies),
    target: 'browser',
    define: {
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    }
}

if(production) {
    config.entrypoints = [Path.join(SRC_ROOT, 'bundle.ts')]
    config.sourcemap = 'none'
    config.minify = {
        whitespace: false,
        identifiers: false,
        syntax: false,
    }
} else {
    config.entrypoints = [Path.join(SRC_ROOT, 'dev.tsx')]
    config.sourcemap = 'external'
    config.minify = false
}

const output = await Bun.build(config)

console.log(output)
