#!/usr/bin/env -S bun -i
import { parseArgs, type ParseArgsConfig } from 'node:util'
import { $ } from 'bun'
import { TableDensity, TerminalLogger } from '../src/loggers/terminal.ts'
import { MIXED_VALUE_ROWS, POSTS, SERVICE_ROWS, TASK_ROWS, WRAPPING_ROWS } from './data.ts'

const PARSE_CONFIG = {
    options: {},
    strict: true,
    allowPositionals: false,
} satisfies ParseArgsConfig

async function main(options: Options): Promise<number | void> {
    void options

    const logger = new TerminalLogger()

    logger.log('plain log', 1, { package: '@mpen/logger', logger: 'terminal' }, [
        3.14,
        159n,
        Symbol('sym'),
        {deep:{object:{here:{now:true}}}},
    ])
    logger.log(new Error('No good'))
    logger.log(Array.from({length:100},(_,i) => 2**i))
    logger.info('info messages include a timestamp and wrap long text cleanly')
    logger.warn('warning with mixed values', 2n, Symbol.for('shared'), true, false, null, undefined)
    logger.error(new Error('example terminal error'))

    logger.info('compact table')
    logger.table(SERVICE_ROWS)

    logger.info('comfortable table with spaces')
    logger.table(TASK_ROWS)

    logger.info('narrow balanced table')
    new TerminalLogger({
        maxWidth: 58,
        table: { density: TableDensity.BALANCED, showIndex: true, striped: true },
    }).table(WRAPPING_ROWS)

    logger.info('vertical table for dense records')
    new TerminalLogger({
        maxWidth: 64,
        table: { showIndex: true, density: TableDensity.VERTICAL, striped: true },
    }).table(MIXED_VALUE_ROWS)

    logger.info('selected post columns')
    new TerminalLogger({
        maxWidth: 72,
        table: { showIndex: true },
    }).table(POSTS.slice(0, 4), ['id', 'title'])
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
