import run, {OptType} from "."
import * as pkg from '../package.json'
import {defineCommand} from './interfaces'

const worldCmd = defineCommand({
    name: "world",
    alias: 'w',
    description: 'Prints "Hello World".',
    options: [
        {
            name: 'name',
            alias: 'n',
            description: "Person you want to greet",
            required: true,
        },
    ],
    flags: [
        {
            name: 'verbose',
            alias: 'v',
            description: "Prints more info",
        },
        {
            name: 'quiet',
            alias: 'q',
            description: "Prints less info",
        }
    ],
    async execute(opts, args, app) {
        console.log(`Hello ${opts.name}`)
    },
})

run({
    name: "hello",
    version: pkg.version,
    argv0: pkg.name,
    commands: [worldCmd],
})
