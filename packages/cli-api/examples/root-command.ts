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
        required: false,
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
        required: false,
        // repeatable: true,
    })
    .arg('disclaimer', {
        description: 'Trailing text',
        repeatable: true,
        required: false,
    })
    .help({
        disableOption: true,
    })
    .run(opts => {
        console.log(opts)
    })

if(import.meta.main) {
    await app.execute()
}
