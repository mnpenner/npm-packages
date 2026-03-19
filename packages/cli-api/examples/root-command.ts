import {App} from '../src'
import * as pkg from '../package.json'

await new App('hello')
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
    .run((args, kwargs) => {
        if (kwargs.verbose) {
            console.log('Preparing greeting...')
        }
        console.log(`Hello ${kwargs.name}`)
    })
    .execute()
