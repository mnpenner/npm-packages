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

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: true,
} satisfies ParseArgsConfig


async function main(options: Options, positionals: Positionals): Promise<number | void> {
    const logger = new EmojiLogger()

    logger.info("info")
    logger.warn("warn")
    logger.error("error")

    logger.info('compact table')
    logger.table(COMPACT_ROWS)

    logger.info('comfortable table')
    logger.table(COMFORTABLE_ROWS)

    logger.info('balanced table')
    new EmojiLogger({table: {maxWidth: 56}}).table(BALANCED_ROWS)

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
