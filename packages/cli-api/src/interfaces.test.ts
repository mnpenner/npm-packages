import {describe, it} from 'bun:test'
import {App, Command, ExecutionContext, OptType} from './interfaces'
import {expectType, TypeEqual} from './testing/type-assert'

describe(Command.name, () => {
    describe('run', () => {
        it('preserves public type inference for the fluent API', () => {
            const greetCommand = new Command('greet')
                .flag('loud')
                .opt('target', {required: true})
                .run((args, opts, context) => {
                    expectType<TypeEqual<typeof args, []>>(true)
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
                .run((args, opts, context) => {
                    expectType<TypeEqual<typeof args, [string, ...string[]]>>(true)
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
                .run((args, opts, context) => {
                    expectType<TypeEqual<typeof args, string[]>>(true)
                    expectType<TypeEqual<typeof opts, {
                        tag: string[]
                        files: string[]
                    }>>(true)
                    expectType<TypeEqual<typeof context, ExecutionContext>>(true)
                })

            const fluentApp = new App('hello')
                .meta({bin: 'hello', version: '1.0.0', author: 'Mark', description: 'Example app'})
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
