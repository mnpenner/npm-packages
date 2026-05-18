import { describe, expect, it } from 'bun:test'
import { MemoryLogger } from './memory.ts'

describe(MemoryLogger.name, () => {
    describe(MemoryLogger.prototype.log.name, () => {
        it('records logs', () => {
            const logger = new MemoryLogger()
            logger.log('hello')
            expect(logger.logs).toEqual([{ level: 'log', data: ['hello'] }])
        })
    })

    describe(MemoryLogger.prototype.info.name, () => {
        it('records info', () => {
            const logger = new MemoryLogger()
            logger.info('hello', 'world')
            expect(logger.logs).toEqual([{ level: 'info', data: ['hello', 'world'] }])
        })
    })

    describe(MemoryLogger.prototype.warn.name, () => {
        it('records warn', () => {
            const logger = new MemoryLogger()
            logger.warn('warning', 123)
            expect(logger.logs).toEqual([{ level: 'warn', data: ['warning', 123] }])
        })
    })

    describe(MemoryLogger.prototype.error.name, () => {
        it('records error', () => {
            const logger = new MemoryLogger()
            const err = new Error('fail')
            logger.error(err)
            expect(logger.logs).toEqual([{ level: 'error', data: [err] }])
        })
    })

    describe(MemoryLogger.prototype.table.name, () => {
        it('records table', () => {
            const logger = new MemoryLogger()
            logger.table({ a: 1 }, ['a'])
            expect(logger.logs).toEqual([{ level: 'table', data: [{ a: 1 }, ['a']] }])
        })
    })

    describe(MemoryLogger.prototype.clear.name, () => {
        it('clears logs', () => {
            const logger = new MemoryLogger()
            logger.info('hello')
            logger.clear()
            expect(logger.logs).toEqual([])
        })
    })
})
