#!/usr/bin/env bun
import {App, Command} from '../src'
import * as pkg from '../package.json'


const app = new App('hello')
    .meta({version: pkg.version, bin: pkg.name, description: 'Example app', author: "Mark Penner"})
    .command(new Command('world')
        .describe('World-related commands.')
        .command(new Command('greet')
            .describe('Greet someone by name.')
            .flag('verbose', {
                alias: 'v',
                description: 'Print extra information',
            })
            .arg('name', {
                description: 'Person you want to greet',
                required: true,
            })
            .run((args, opts) => {
                if(opts.verbose) {
                    console.log(`Running greet ${pkg.version}`)
                }
                console.log(`Hello ${opts.name}`)
            })
        )
    )

if(import.meta.main) {
    await app.execute()
}
