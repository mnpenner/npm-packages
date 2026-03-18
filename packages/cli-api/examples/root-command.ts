import run, {defineApp} from '../src'
import * as pkg from '../package.json'

run(defineApp({
    name: 'hello',
    version: pkg.version,
    argv0: pkg.name,
    options: [
        {
            name: 'name',
            alias: 'n',
            description: 'Person you want to greet',
            required: true,
        },
    ],
    flags: [
        {
            name: 'verbose',
            alias: 'v',
            description: 'Prints more info',
        },
    ],
    async execute(opts) {
        if (opts.verbose) {
            console.log('Preparing greeting...')
        }
        console.log(`Hello ${opts.name}`)
    },
}))
