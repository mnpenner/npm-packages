#!/usr/bin/env bun
import {App} from '../src'
import * as pkg from '../package.json'

const app = new App('hello')
    .meta({
        version: pkg.version,
        bin: pkg.name,
        author: 'Mark Penner',
        description: 'Example app',
    })
    .flag('verbose', {
        alias: 'v',
        description: 'Prints more info',
    })
    .opt('name', {
        alias: 'n',
        description: 'Person you want to greet',
        required: true,
        valuePlaceholder: 'PeRsOn',
    })
    .opt('shout', {
        description: 'Shout the greeting',
        valueNotRequired: true,
    })
    .arg('greeting', {
        description: 'Greeting to print',
        key: 'greet',
        defaultValue: 'Hello',
        required: true,
        // repeatable: true,
    })
    .arg('disclaimer', {
        description: 'Trailing text',
        repeatable: true,
        required: true,
    })
    .run((args, opts) => {
        if (opts.verbose) {
            console.log('Preparing greeting...')
        }
        const greeting = opts.shout
            ? `${opts.greet} ${opts.name}!`.toUpperCase()
            : `${opts.greet} ${opts.name}.`
        console.log(greeting)

        if(opts.disclaimer.length) {
            console.log(`Disclaimer: ${opts.disclaimer.join(', ')}`)
        }
        return 5
    })

if(import.meta.main) {
    await app.execute()
}
