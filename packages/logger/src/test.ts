#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import { TerminalLogger, TableDensity } from './loggers/terminal.ts'
import jsSerialize from 'js-serialize'
import { jsonAscii } from './json.ts'
import { JsonLogger } from './loggers/json.ts'

const COMPACT_ROWS = [
    { key: 'api', state: 'ok', ms: 12 },
    { key: 'db', state: 'ok', ms: 8 },
]

const COMFORTABLE_ROWS = [
    { owner: 'Ada Lovelace', task: 'review notes', status: 'in progress' },
    { owner: 'Grace Hopper', task: 'ship build', status: 'ready' },
]

const BALANCED_ROWS = [
    {
        section: 'release notes',
        description: 'Draft customer facing copy for the package updates before publishing',
    },
    {
        section: 'validation',
        description: 'Run the narrow table example so wrapping is easy to inspect',
    },
]

const FUN_DATA = [
    {
        number: 1,
        bigint: 2n,
        title: 'first',
        uniqueSymbol: Symbol(),
        namedSymbol: Symbol('named'),
        wellKnownSymbol: Symbol.for('symbol'),
        function: (x: number) => x * 2,
        object: { n: 1, s: 'x',a:[2,3] },
        array: [1, 'b', 3n],
        null: null,
        undefined: undefined,
    },
    {
        number: 2,
        bigint: 4n,
        title: 'second',
        true: true,
        false: false,
    },
]



const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig


async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const jsonLogger = new JsonLogger()
    const defaultLogger = new TerminalLogger()
    const verticalLogger = new TerminalLogger({table:{density:TableDensity.VERTICAL,striped:true}})
    const maxWidthLogger = new TerminalLogger({
        maxWidth: 56,
        table: {
            showIndex: true,
            striped: true,
        },
    })
    const balancedLogger = new TerminalLogger({
        maxWidth: 56,
        table: {
            density: TableDensity.BALANCED,
        },
    })

    // console.log(jsSerialize('⚠️'))
    // console.log(JSON.stringify('\u26a0\ufe0f'))
    // console.log(jsonAscii('thr😀ee\n'))
    defaultLogger.log("log",1,{foo:3n})
    console.log("log",1,{foo:3n})
    defaultLogger.info("info")
    defaultLogger.warn("warn")
    defaultLogger.error("error")
    jsonLogger.error("error")
    defaultLogger.warn(1, 'hello', 2n, (x: number) => x * 2, Symbol(), true, false, null, 'world', [
        1,
        2n,
        "thr😀ee orem Ipsum is simply dummy text of the printing and typeset'\"ting indu⚠️stry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ips",
    ])
    jsonLogger.log(1, 'hello', 2n, (x: number) => x * 2, Symbol(), true, false, null, 'world', [
        1,
        2n,
        "thr😀ee orem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ips",
    ])

    defaultLogger.info(
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    )
    defaultLogger.error(new Error("everything went wrong"))

    // defaultLogger.info('compact table')
    defaultLogger.table(COMPACT_ROWS)
    // maxWidthLogger.table(COMPACT_ROWS)
    //
    // // defaultLogger.info('comfortable table')
    // defaultLogger.table(COMFORTABLE_ROWS)
    // maxWidthLogger.table(COMFORTABLE_ROWS)
    //
    // console.log('defaultLogger - balanced rows')
    // defaultLogger.table(BALANCED_ROWS)
    // console.log('maxWidthLogger - balanced rows')
    // maxWidthLogger.table(BALANCED_ROWS)
    // console.log('balancedLogger - balanced rows')
    // balancedLogger.table(BALANCED_ROWS)
    //
    // defaultLogger.table(FUN_DATA)
    // verticalLogger.table(FUN_DATA)

    // logger.info('post table')
    // logger.table(POSTS)
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig["values"]
type Positionals = ParsedConfig["positionals"]

if(import.meta.main) {
    const {values, positionals} = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
        (exitCode) => {
            if(typeof exitCode === "number") {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if(err instanceof $.ShellError) {
                console.error(`Command failed with exit code ${err.exitCode}`)
                process.exitCode = err.exitCode
            } else {
                console.error(err ?? 'An unknown error occurred')
                process.exitCode = 1
            }
        },
    )
}
//#endregion
