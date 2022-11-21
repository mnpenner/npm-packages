#!/usr/bin/env zx
import * as dotenv from 'dotenv' // @^16
dotenv.config()

$.cwd = `${__dirname}/..`
$.env.FORCE_COLOR=1

// $`pnpm exec esbuild src/main.ts --bundle --outfile=dist/onemig.js --platform=node --sourcemap --watch`

// const main = path.relative($.cwd,`${__dirname}/../src/main.ts`)
// console.log(main)

const relpath = p => path.relative($.cwd, path.resolve(__dirname,'..',p))

for(;;) {
    const cmd = await question("$ onemig ")
    try {
        await $`pnpm exec esbuild src/main.ts --bundle --outfile=dist/onemig.js --platform=node --sourcemap`
        await $([`node --enable-source-maps --max-old-space-size=16384 dist/onemig.js ${cmd}`])
    } catch(err) {
        console.error(chalk.red(`Command failed with exit code ${err.exitCode}`))
    }
    console.log()
}
