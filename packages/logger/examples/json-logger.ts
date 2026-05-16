#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import { LogLevel } from '../src/logger.ts'
import { JsonLogger } from '../src/loggers/json.ts'
import { MIXED_VALUE_ROWS, POSTS, SERVICE_ROWS } from './data.ts'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: false,
} satisfies ParseArgsConfig

async function main(options: Options): Promise<number | void> {
    void options

    const logger = new JsonLogger()

    logger.log('debug message')
    logger.info('single string becomes a message field')
    logger.warn('mixed values become a data array', 2n, Symbol.for('shared'), undefined)
    logger.error(new Error('example json error'))
    logger.table(SERVICE_ROWS)
    logger.table(POSTS.slice(0, 3), ['id', 'userId', 'title'])
    logger.log('non-json values are serialized without throwing', MIXED_VALUE_ROWS[0])

    const minWarnLogger = new JsonLogger({
        minLogLevel: LogLevel.WARN,
        writeLine: (line) => console.log(line),
    })

    minWarnLogger.log('filtered debug')
    minWarnLogger.info('filtered info')
    minWarnLogger.warn('visible warning from minLogLevel example')
    minWarnLogger.error('visible error from minLogLevel example')
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig['values']

if (import.meta.main) {
    const { values } = parseArgs(PARSE_CONFIG)

    main(values).then(
        (exitCode) => {
            if (typeof exitCode === 'number') {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if (err instanceof $.ShellError) {
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
