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
        valuePlaceholder: 'PERSON',
    })
    .opt('shout', {
        description: 'Shout the greeting',
        valueNotRequired: true,
    })
    .arg('greeting', {
        description: 'Greeting to print',
        defaultValue: 'Hello',
        required: true,
    })
    .arg('disclaimer', {
        description: 'Trailing text',
        repeatable: true,
        required: true,
    })
    .run((args, kwargs) => {
        if (kwargs.verbose) {
            console.log('Preparing greeting...')
        }
        const greeting = kwargs.shout
            ? `${kwargs.greeting} ${kwargs.name}!`.toUpperCase()
            : `${kwargs.greeting} ${kwargs.name}.`
        console.log(greeting)

        if(kwargs.disclaimer.length) {
            console.log(`Disclaimer: ${kwargs.disclaimer.join(', ')}`)
        }
        return 5
    })

if(import.meta.main) {
    await app.execute()
}
