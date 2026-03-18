import { defineApp, defineCommand, defineFlags, defineOptions } from '../src/interfaces'
import { expectType, TypeEqual } from '../src/testing/type-assert'

const rootApp = defineApp({
    name: 'hello',
    argv0: 'hello',
    options: defineOptions([
        {
            name: 'name',
            required: true,
        },
    ]),
    flags: defineFlags([
        {
            name: 'verbose',
            alias: 'v',
        },
    ]),
    async execute(opts) {
        type Actual = typeof opts
        type Expected = {
            name: string
            verbose?: boolean
        }

        expectType<TypeEqual<Expected, Actual>>(true)
    },
})

const subCommand = defineCommand({
    name: 'greet',
    options: defineOptions([
        {
            name: 'target',
            required: true,
        },
    ]),
    flags: defineFlags([
        {
            name: 'loud',
        },
    ]),
    async execute(opts) {
        type Actual = typeof opts
        type Expected = {
            target: string
            loud?: boolean
        }

        expectType<TypeEqual<Expected, Actual>>(true)
    },
})

const commandApp = defineApp({
    name: 'hello',
    subCommands: [subCommand],
})

void rootApp
void commandApp
