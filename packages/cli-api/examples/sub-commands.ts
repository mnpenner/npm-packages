import {App, Command} from '../src'
import * as pkg from '../package.json'

const greetCommand = new Command('greet')
    .describe('Greet someone by name.')
    .flag('verbose', {
        alias: 'v',
        description: 'Print extra information',
    })
    .opt('name', {
        alias: 'n',
        description: 'Person you want to greet',
        required: true,
    })
    .run((args, kwargs) => {
        if (kwargs.verbose) {
            console.log(`Running greet ${pkg.version}`)
        }
        console.log(`Hello ${kwargs.name}`)
    })

const worldCommand = new Command('world')
    .describe('World-related commands.')
    .command(greetCommand)

await new App('hello')
    .meta({version: pkg.version, argv0: pkg.name})
    .command(worldCommand)
    .execute()
