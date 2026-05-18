import type { Logger } from '../logger.ts'

/**
 * A single recorded log entry from a {@link MemoryLogger}.
 *
 * @example
 * ```ts
 * const record: MemoryLogRecord = { level: 'info', data: ['hello', 'world'] }
 * ```
 */
export interface MemoryLogRecord {
    /**
     * The method that was called.
     */
    level: 'log' | 'info' | 'warn' | 'error' | 'table'
    /**
     * The arguments passed to the method.
     */
    data: any[]
}

/**
 * A logger implementation that records all calls in memory instead of outputting them.
 * Useful for testing and inspection.
 *
 * @example
 * ```ts
 * import { MemoryLogger } from '@mpen/logger'
 *
 * const logger = new MemoryLogger()
 * logger.info('Hello', 'World')
 *
 * console.log(logger.logs) // [{ level: 'info', data: ['Hello', 'World'] }]
 * ```
 */
export class MemoryLogger implements Logger {
    /**
     * The recorded log entries.
     */
    public logs: MemoryLogRecord[] = []

    /**
     * Records a debug-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    log(...data: any[]): void {
        this.logs.push({ level: 'log', data })
    }

    /**
     * Records an info-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    info(...data: any[]): void {
        this.logs.push({ level: 'info', data })
    }

    /**
     * Records a warning-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    warn(...data: any[]): void {
        this.logs.push({ level: 'warn', data })
    }

    /**
     * Records an error-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    error(...data: any[]): void {
        this.logs.push({ level: 'error', data })
    }

    /**
     * Records tabular data.
     *
     * @param tabularData - Data to render as rows.
     * @param properties - Optional property names to include and order.
     * @returns Nothing.
     */
    table(tabularData?: any, properties?: string[]): void {
        this.logs.push({ level: 'table', data: [tabularData, properties] })
    }

    /**
     * Clears all recorded logs.
     *
     * @returns Nothing.
     */
    clear(): void {
        this.logs = []
    }
}
