import { describe, expect, it } from 'bun:test'
import { TableDensity, TerminalLogger } from './terminal.ts'

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

        logger.log('payload', {
            id: 1,
            nested: { value: 2 },
            list: [1, 'two', circular],
            [Symbol.for('source')]: 'test',
        }, [3.14, 159n, Symbol('sym')])

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
