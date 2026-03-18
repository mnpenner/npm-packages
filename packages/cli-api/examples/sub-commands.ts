import run, {defineApp, defineCommand} from '../src'
import * as pkg from '../package.json'

const greetCommand = defineCommand({
    name: 'greet',
    description: 'Greet someone by name.',
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
            description: 'Print extra information',
        },
    ],
    async execute(opts) {
        if (opts.verbose) {
            console.log(`Running ${this.name} ${pkg.version}`)
        }
        console.log(`Hello ${opts.name}`)
    },
})

const worldCommand = defineCommand({
    name: 'world',
    description: 'World-related commands.',
    subCommands: [
        greetCommand,
    ],
})

run(defineApp({
    name: 'hello',
    version: pkg.version,
    argv0: pkg.name,
    subCommands: [
        worldCommand,
    ],
}))
