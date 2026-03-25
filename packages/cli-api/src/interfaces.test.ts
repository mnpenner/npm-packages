import {describe, it} from 'bun:test'
import {App, Command, ExecutionContext, OptType} from './interfaces'
import type {AnyOptType} from './index'
import {expectType, TypeEqual} from './testing/type-assert'

describe(Command.name, () => {
    describe('public exports', () => {
        it('re-exports AnyOptType from the package entrypoint', () => {
            const enumLikeType = ['fast', 'slow'] as const satisfies AnyOptType

            expectType<TypeEqual<typeof enumLikeType, readonly ['fast', 'slow']>>(true)
        })
    })

    describe('run', () => {
        it('preserves public type inference for the fluent API', () => {
            const greetCommand = new Command('greet')
                .flag('loud')
                .opt('target', {required: true})
                .run((opts, context) => {
                    expectType<TypeEqual<typeof opts, {
                        target: string
                        loud?: boolean
                    }>>(true)
                    expectType<TypeEqual<typeof context, ExecutionContext>>(true)
                })

            const inspectCommand = new Command('inspect')
                .flag('verbose', {alias: 'v'})
                .opt('count', {type: OptType.INT, required: true})
                .opt('mode', {type: ['fast', 'slow'] as const})
                .arg('input', {required: true})
                .arg('rest', {repeatable: true})
                .run((opts, context) => {
                    expectType<TypeEqual<typeof opts, {
                        count: number
                        verbose?: boolean
                        mode?: 'fast' | 'slow'
                        input: string
                        rest: string[]
                    }>>(true)
                    expectType<TypeEqual<typeof context, ExecutionContext>>(true)
                })

            const boundedCommand = new Command('bounded')
                .opt('tag', {repeatable: 2})
                .arg('files', {repeatable: 3, required: 2})
                .run((opts, context) => {
                    expectType<TypeEqual<typeof opts, {
                        tag: string[]
                        files: string[]
                    }>>(true)
                    expectType<TypeEqual<typeof context, ExecutionContext>>(true)
                })

            const fluentApp = new App('hello')
                .meta({bin: 'hello', version: '1.0.0', author: 'Mark', description: 'Example app'})
                .help({name: 'aide', alias: ['a'], disableCommand: true, disableOption: false})
                .version({name: 'versión', alias: 'V', disableCommand: false, disableOption: true})
                .color({name: 'colour', alias: 'C', disableOption: false})
                .version('1.0.1')
                .command(greetCommand)
                .command(inspectCommand)
                .command(boundedCommand)

            expectType<TypeEqual<typeof fluentApp.execute, (args?: string[]) => Promise<number>>>(true)

            void greetCommand
            void inspectCommand
            void boundedCommand
            void fluentApp
        })
    })
})
