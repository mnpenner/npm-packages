import { describe, expect, it } from 'bun:test'
import { TableDensity, TerminalLogger } from './terminal.ts'
import path from 'node:path'

function restoreProperty(
    target: object,
    property: string,
    descriptor: PropertyDescriptor | undefined,
): void {
    if (descriptor == null) {
        Reflect.deleteProperty(target, property)
        return
    }

    Object.defineProperty(target, property, descriptor)
}

describe(TerminalLogger.name, () => {
    it('renders plain log values with colorized pretty inspection', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: false,
            maxWidth: 120,
            write: (line) => lines.push(line),
        })
        const circular: Record<string, unknown> = { ok: true }
        circular.self = circular

        logger.log(
            'payload',
            {
                id: 1,
                nested: { value: 2 },
                list: [1, 'two', circular],
                [Symbol.for('source')]: 'test',
            },
            [3.14, 159n, Symbol('sym')],
        )

        const output = lines.join('')

        expect(output).toContain('payload  {')
        expect(output).toContain('id: 1')
        expect(output).toContain('nested: {')
        expect(output).toContain('value: 2')
        expect(output).toContain('list: [')
        expect(output).toContain('"two"')
        expect(output).toContain('[Circular]')
        expect(output).toContain('[Symbol(source)]: "test"')
        expect(output).toContain('}  [')
        expect(output).toContain('3.14')
        expect(output).toContain('159n')
        expect(output).toContain('Symbol(sym)')
    })

    it('renders Error values with stack, cause, and aggregate errors', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: false,
            maxWidth: 120,
            write: (line) => lines.push(line),
        })
        const cause = new Error('database unavailable')
        cause.stack = 'Error: database unavailable\n    at connect'
        const first = new TypeError('bad id')
        first.stack = 'TypeError: bad id\n    at parseId'
        const error = new AggregateError([first, 'fallback failed'], 'request failed', { cause })
        error.stack = 'AggregateError: request failed\n    at handleRequest'

        logger.error(error)

        const output = lines.join('')

        expect(output).toContain('AggregateError: request failed')
        expect(output).toContain('    at handleRequest')
        expect(output).toContain('cause:')
        expect(output).toContain('Error: database unavailable')
        expect(output).toContain('errors:')
        expect(output).toContain('TypeError: bad id')
        expect(output).toContain('"fallback failed"')
    })

    it('renders Error stack paths relative to cwd by default', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: false,
            maxWidth: 200,
            write: (line) => lines.push(line),
        })
        const filepath = path.join(
            process.cwd(),
            'packages',
            'logger',
            'src',
            'loggers',
            'terminal.ts',
        )
        const relativePath = path.relative(process.cwd(), filepath)
        const error = new Error('response validation failed')
        error.name = 'ValibotResponseValidationError'
        error.stack = [
            'ValibotResponseValidationError: response validation failed',
            `    at parseResponseSchema (${filepath}:613:15)`,
            `    at ${filepath}:638:24`,
        ].join('\n')

        logger.error(error)

        const output = lines.join('')

        expect(output).toContain(`at parseResponseSchema (${relativePath}:613:15)`)
        expect(output).toContain(`at ${relativePath}:638:24`)
        expect(output).not.toContain(`${filepath}:613:15`)
    })

    it('uses errorRootPath when rendering Error stack paths', () => {
        const lines: string[] = []
        const errorRootPath = path.join(process.cwd(), 'packages')
        const logger = new TerminalLogger({
            color: false,
            errorRootPath,
            maxWidth: 200,
            write: (line) => lines.push(line),
        })
        const filepath = path.join(
            process.cwd(),
            'packages',
            'logger',
            'src',
            'loggers',
            'terminal.ts',
        )
        const relativePath = path.relative(errorRootPath, filepath)
        const error = new Error('response validation failed')
        error.stack = [
            'Error: response validation failed',
            `    at validateHandlerResult (${filepath}:638:24)`,
        ].join('\n')

        logger.error(error)

        expect(lines.join('')).toContain(`at validateHandlerResult (${relativePath}:638:24)`)
    })

    it('does not duplicate multiline Error message lines from the stack header', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: false,
            maxWidth: 200,
            write: (line) => lines.push(line),
        })
        const filepath = path.join(
            process.cwd(),
            'packages',
            'routekit',
            'src',
            'router',
            'routes',
            'valibot',
            'valibot.ts',
        )
        const error = new Error(
            [
                'Response validation failed for status 400: × Invalid type: Expected number but received "url_path"',
                '  → at component',
            ].join('\n'),
        )
        error.name = 'ValibotResponseValidationError'
        error.stack = [
            `ValibotResponseValidationError: ${error.message}`,
            `    at parseResponseSchema (${filepath}:613:19)`,
        ].join('\n')

        logger.error(error)

        const output = lines.join('')

        expect(output.match(/→ at component/gu)).toHaveLength(1)
        expect(output).toContain('at parseResponseSchema')
    })

    it('colors Error names separately from colons and messages', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: true,
            maxWidth: 200,
            write: (line) => lines.push(line),
        })
        const error = new TypeError('bad input')
        error.stack = 'TypeError: bad input'

        logger.error(error)

        const output = lines.join('')

        expect(output).toContain('\x1B[91mT\x1B[0m')
        expect(output).toContain('\x1B[90m:\x1B[0m\x1B[90m \x1B[0m')
        expect(output).toContain('\x1B[37mb\x1B[0m')
        expect(output).not.toContain('\x1B[91m:\x1B[0m')
    })

    it('renders extra enumerable Error properties', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: false,
            maxWidth: 200,
            write: (line) => lines.push(line),
        })
        const error = new Error('Response validation failed for status 400') as Error & {
            issues: unknown[]
            status: number
        }
        error.name = 'ValibotResponseValidationError'
        error.status = 400
        error.issues = [
            {
                expected: 'number',
                message: 'Invalid type',
                received: '"url_path"',
            },
        ]
        error.stack = 'ValibotResponseValidationError: Response validation failed for status 400'

        logger.error(error)

        const output = lines.join('')

        expect(output).toContain('status: 400')
        expect(output).toContain('issues: [')
        expect(output).toContain('expected: "number"')
        expect(output).toContain('received: \'"url_path"\'')
    })

    it('keeps later log arguments after multiline error details', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: false,
            maxWidth: 200,
            write: (line) => lines.push(line),
        })
        const error = new Error('request failed')
        error.stack = 'Error: request failed\n    at handleRequest\n    at dispatch'

        logger.error('Routekit internal server error', error, {
            method: 'GET',
            url: 'http://localhost:3000/users/123x',
        })

        const output = lines.join('')
        const stackIndex = output.indexOf('    at handleRequest')
        const metadataIndex = output.indexOf(
            '{method:"GET",url:"http://localhost:3000/users/123x"}',
        )

        expect(stackIndex).not.toBe(-1)
        expect(metadataIndex).not.toBe(-1)
        expect(stackIndex < metadataIndex).toBe(true)
    })

    it('uses COLUMNS when stdio column counts are unavailable', () => {
        const stdoutColumns = Object.getOwnPropertyDescriptor(process.stdout, 'columns')
        const stderrColumns = Object.getOwnPropertyDescriptor(process.stderr, 'columns')
        const previousColumns = process.env.COLUMNS
        const lines: string[] = []

        try {
            Object.defineProperty(process.stdout, 'columns', {
                configurable: true,
                value: undefined,
            })
            Object.defineProperty(process.stderr, 'columns', {
                configurable: true,
                value: undefined,
            })
            process.env.COLUMNS = '120'

            const logger = new TerminalLogger({
                color: false,
                write: (line) => lines.push(line),
            })

            logger.error('x'.repeat(90))
        } finally {
            restoreProperty(process.stdout, 'columns', stdoutColumns)
            restoreProperty(process.stderr, 'columns', stderrColumns)

            if (previousColumns == null) {
                delete process.env.COLUMNS
            } else {
                process.env.COLUMNS = previousColumns
            }
        }

        const outputLines = lines.join('').trimEnd().split('\n')

        expect(outputLines).toHaveLength(1)
        expect(outputLines[0]).toContain('x'.repeat(90))
    })

    it('right-aligns numeric table columns that only contain numbers, null, or undefined', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: false,
            write: (line) => lines.push(line),
        })

        logger.table(
            [
                { name: 'alpha', count: 1 },
                { name: 'beta', count: null },
                { name: 'gamma', count: 23 },
                { name: 'delta' },
            ],
            ['name', 'count'],
        )

        const output = lines.join('')

        expect(output).toContain('alpha│    1')
        expect(output).toContain('beta │ null')
        expect(output).toContain('gamma│   23')
        expect(output).toContain('delta│')
    })

    it('stripes only vertical table labels', () => {
        const lines: string[] = []
        const logger = new TerminalLogger({
            color: true,
            table: { density: TableDensity.VERTICAL, striped: true },
            write: (line) => lines.push(line),
        })

        logger.table([
            { name: 'alpha', count: 1 },
            { name: 'beta', count: 2 },
        ])

        const output = lines.join('')

        expect(output).toContain('\x1B[48;2;24;24;24m┌  name:\x1B[49m beta')
        expect(output).toContain('\x1B[48;2;24;24;24m└ count:\x1B[49m \x1B[94m2\x1B[39m')
    })
})
