#!/usr/bin/env bun
import {App} from '../src'
import * as pkg from '../package.json'

const app = new App('hello')
    .meta({version: pkg.version, argv0: pkg.name})
    .flag('verbose', {
        alias: 'v',
        description: 'Prints more info',
    })
    .opt('name', {
        alias: 'n',
        description: 'Person you want to greet',
        required: true,
    })
    .arg('greeting', {
        description: 'Greeting to print',
        defaultValue: 'Hello',
    })
    .run((args, kwargs) => {
        if (kwargs.verbose) {
            console.log('Preparing greeting...')
        }
        console.log(`${kwargs.greeting} ${kwargs.name}`)
        return 5
    })

if(import.meta.main) {
    await app.execute()
}
