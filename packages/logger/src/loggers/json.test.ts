import { describe, expect, it } from 'bun:test'
import { JsonLogger } from './json.ts'

describe(JsonLogger.name, () => {
    it('writes ascii json for log values that JSON.stringify cannot serialize', () => {
        const lines: string[] = []
        const logger = new JsonLogger({ writeLine: (line) => lines.push(line) })

        logger.log('message', 2n, Symbol('symbol'), undefined, new Set([3n]))

        expect(lines).toHaveLength(1)
        expect(lines[0]).not.toMatch(/[^\x00-\x7F]/u)

        const payload = JSON.parse(lines[0]!)

        expect(payload.level).toBe('log')
        expect(payload.data).toEqual(['message', 2, 'Symbol(symbol)', '[undefined]', [3]])
        expect(typeof payload.time).toBe('string')
    })

    it('writes structured table data with terminal-compatible sorted properties', () => {
        const lines: string[] = []
        const logger = new JsonLogger({ writeLine: (line) => lines.push(line) })

        logger.table([
            { item10: 'ten', name: 'Ada', id: 2, item2: 'two' },
            { key: 'db', title: 'Database', zebra: true },
        ])

        expect(lines).toHaveLength(1)

        const payload = JSON.parse(lines[0]!)

        expect(payload.level).toBe('log')
        expect(payload.table).toEqual({
            properties: ['id', 'key', 'name', 'title', 'item2', 'item10', 'zebra'],
            values: [
                [2, '[undefined]', 'Ada', '[undefined]', 'two', 'ten', '[undefined]'],
                [
                    '[undefined]',
                    'db',
                    '[undefined]',
                    'Database',
                    '[undefined]',
                    '[undefined]',
                    true,
                ],
            ],
        })
        expect(typeof payload.time).toBe('string')
    })

    it('writes structured table data with explicit properties order', () => {
        const lines: string[] = []
        const logger = new JsonLogger({ writeLine: (line) => lines.push(line) })

        logger.table(
            [
                { id: 1, name: 'Ada', hidden: true },
                { id: 2, name: 'Grace', hidden: false },
            ],
            ['name', 'id'],
        )

        const payload = JSON.parse(lines[0]!)

        expect(payload.table).toEqual({
            properties: ['name', 'id'],
            values: [
                ['Ada', 1],
                ['Grace', 2],
            ],
        })
    })
})
