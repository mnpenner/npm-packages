import run from ".";
import * as pkg from '../package.json'

run({
    name: "hello",
    version: pkg.version,
    argv0: pkg.name,
    commands: [
        {
            name: "world",
            alias: 'w',
            description: 'Prints "Hello World".',
            async execute(opts, args) {
                console.log(`Hello ${opts.name}`)
            },
            options: [
                {
                    name: 'name',
                    alias: 'n',
                    description: "Person you want to greet",
                    required: true,
                },
            ]
        }
    ]
})
