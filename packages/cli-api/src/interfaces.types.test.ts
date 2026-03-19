import {it} from 'bun:test'
import {App, Command, OptType, defineApp, defineCommand, defineFlags, defineOptions} from './interfaces'
import {expectType, TypeEqual} from './testing/type-assert'

it('preserves public type inference for object and fluent APIs', () => {
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
            type Expected = {
                name: string
                verbose?: boolean
            }

            expectType<TypeEqual<typeof opts, Expected>>(true)
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
            type Expected = {
                target: string
                loud?: boolean
            }

            expectType<TypeEqual<typeof opts, Expected>>(true)
        },
    })

    const commandApp = defineApp({
        name: 'hello',
        subCommands: [subCommand],
    })

    const fluentCommand = new Command('greet')
        .flag('verbose', {alias: 'v'})
        .opt('count', {type: OptType.INT, required: true})
        .opt('mode', {type: ['fast', 'slow'] as const})
        .arg('input', {required: true})
        .arg('rest', {repeatable: true})
        .run((args, kwargs) => {
            expectType<TypeEqual<typeof args, [string, ...string[]]>>(true)
            expectType<TypeEqual<typeof kwargs, {
                count: number
                verbose?: boolean
                mode?: 'fast' | 'slow'
                input: string
                rest?: string[]
            }>>(true)
        })

    const fluentApp = new App('hello')
        .withArgv0('hello')
        .withVersion('1.0.0')
        .command(fluentCommand)

    void rootApp
    void commandApp
    void fluentCommand
    void fluentApp
})
