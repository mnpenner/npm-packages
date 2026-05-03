import { describe, it } from 'bun:test'
import type { ExecutionContext } from './interfaces'
import { App, Command, OptType } from './interfaces'
import type { AnyOptType } from './index'
import type { TypeEqual } from '@mpen/ts-types'
import { expectType } from '@mpen/ts-types'

describe(Command.name, () => {
    describe('public exports', () => {
        it('re-exports AnyOptType from the package entrypoint', () => {
            const _enumLikeType = ['fast', 'slow'] as const satisfies AnyOptType

            expectType<TypeEqual<typeof _enumLikeType, readonly ['fast', 'slow']>>(true)
        })
    })

    describe('run', () => {
        it('preserves public type inference for the fluent API', () => {
            const greetCommand = new Command('greet')
                .flag('loud')
                .opt('target', { required: true })
                .run((_opts, _context) => {
                    type Simplify<T> = { [K in keyof T]: T[K] } & {}
                    expectType<
                        TypeEqual<
                            Simplify<typeof _opts>,
                            {
                                target: string
                                loud: boolean
                            }
                        >
                    >(true)
                    expectType<TypeEqual<typeof _context, ExecutionContext>>(true)
                })

            const inspectCommand = new Command('inspect')
                .flag('verbose', { alias: 'v' })
                .opt('count', { type: OptType.INT, required: true })
                .opt('mode', { type: ['fast', 'slow'] as const })
                .arg('input', { required: true })
                .arg('rest', { repeatable: true })
                .run((_opts, _context) => {
                    type Simplify<T> = { [K in keyof T]: T[K] } & {}
                    expectType<
                        TypeEqual<
                            Simplify<typeof _opts>,
                            {
                                count: number
                                verbose: boolean
                                mode?: 'fast' | 'slow'
                                input: string
                                rest: string[]
                            }
                        >
                    >(true)
                    expectType<TypeEqual<typeof _context, ExecutionContext>>(true)
                })

            const boundedCommand = new Command('bounded')
                .opt('tag', { repeatable: 2 })
                .arg('files', { repeatable: 3, required: 2 })
                .run((_opts, _context) => {
                    type Simplify<T> = { [K in keyof T]: T[K] } & {}
                    expectType<
                        TypeEqual<
                            Simplify<typeof _opts>,
                            {
                                tag: string[]
                                files: string[]
                            }
                        >
                    >(true)
                    expectType<TypeEqual<typeof _context, ExecutionContext>>(true)
                })

            const bulkCommand = new Command('bulk')
                .options([
                    { name: 'enabled', type: OptType.BOOL },
                    { name: 'count', propName: 'total', type: OptType.INT, required: true },
                ] as const)
                .arguments([{ name: 'input', required: true }] as const)
                .run((_opts, _context) => {
                    type Simplify<T> = { [K in keyof T]: T[K] } & {}
                    expectType<
                        TypeEqual<
                            Simplify<typeof _opts>,
                            {
                                enabled: boolean
                                total: number
                                input: string
                            }
                        >
                    >(true)
                    expectType<TypeEqual<typeof _context, ExecutionContext>>(true)
                })

            const fluentApp = new App('hello')
                .meta({
                    bin: 'hello',
                    version: '1.0.0',
                    author: 'Mark',
                    description: 'Example app',
                })
                .help({ name: 'aide', alias: ['a'], disableCommand: true, disableOption: false })
                .version({
                    name: 'versión',
                    alias: 'V',
                    disableCommand: false,
                    disableOption: true,
                })
                .color({ name: 'colour', alias: 'C', disableOption: false })
                .version('1.0.1')
                .command(greetCommand)
                .command(inspectCommand)
                .command(boundedCommand)
                .command(bulkCommand)

            expectType<TypeEqual<typeof fluentApp.execute, (args?: string[]) => Promise<number>>>(
                true,
            )

            void greetCommand
            void inspectCommand
            void boundedCommand
            void bulkCommand
            void fluentApp
        })
    })
})
