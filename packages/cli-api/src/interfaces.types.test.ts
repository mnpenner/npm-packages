import {it} from 'bun:test'
import {App, Command, OptType} from './interfaces'
import {expectType, TypeEqual} from './testing/type-assert'

it('preserves public type inference for the fluent API', () => {
    const greetCommand = new Command('greet')
        .flag('loud')
        .opt('target', {required: true})
        .run((args, kwargs) => {
            expectType<TypeEqual<typeof args, []>>(true)
            expectType<TypeEqual<typeof kwargs, {
                target: string
                loud?: boolean
            }>>(true)
        })

    const inspectCommand = new Command('inspect')
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
        .meta({argv0: 'hello', version: '1.0.0', description: 'Example app'})
        .command(greetCommand)
        .command(inspectCommand)

    expectType<TypeEqual<typeof fluentApp.execute, (args?: string[]) => Promise<number>>>(true)

    void greetCommand
    void inspectCommand
    void fluentApp
})
