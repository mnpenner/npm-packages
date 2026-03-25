#!/usr/bin/env bun
import {App, OptType} from '../src'
import * as pkg from '../package.json'

const app = new App('hello')
    .meta({
        version: pkg.version,
        bin: pkg.name,
        author: 'Mark Penner',
        description: 'Example app',
    })
    .options([
        {
            name: 'verbose',
            alias: 'v',
            type: OptType.BOOL,
            description: 'Prints more info',
        },
        {
            name: 'name',
            alias: 'n',
            description: 'Person you want to greet',
            required: false,
            valuePlaceholder: 'PeRsOn',
        },
        {
            name: 'shout',
            description: 'Shout the greeting',
            valueNotRequired: true,
        },
        {
            name: 'simpleopt',
        },
    ])
    .arguments([
        {
            name: 'simplearg',
        },
        {
            name: 'greeting',
            description: 'Greeting to print',
            propName: 'greet',
            defaultValue: 'Hello',
            required: false,
        },
        {
            name: 'disclaimer',
            description: 'Trailing text',
            repeatable: true,
            required: false,
        },
    ])
    .help({
        disableOption: false,
    })
    .run(opts => {
        console.log(opts)
    })

if(import.meta.main) {
    await app.execute()
}


