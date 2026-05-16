#!/usr/bin/env -S bun -i
import {parseArgs, type ParseArgsConfig} from "node:util"
import {$} from 'bun'
import { EmojiLogger } from './loggers/emoji.ts'
import { POSTS } from './test-data.ts'

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
        summary: 'Draft customer facing copy for the package updates before publishing',
    },
    {
        section: 'validation',
        summary: 'Run the narrow table example so wrapping is easy to inspect',
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
    const logger = new EmojiLogger()
    const logger2 = new EmojiLogger({
        table: {
            showIndex: true,
            striped: false,
            maxWidth: 56,
        },
    })

    logger.info("info")
    logger.warn("warn")
    logger.error("error")

    logger.info('compact table')
    logger.table(COMPACT_ROWS)
    logger2.table(COMPACT_ROWS)

    logger.info('comfortable table')
    logger.table(COMFORTABLE_ROWS)
    logger2.table(COMFORTABLE_ROWS)

    logger.table(BALANCED_ROWS)
    logger.info('balanced table')
    logger2.table(BALANCED_ROWS)

    logger.table(FUN_DATA)

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
