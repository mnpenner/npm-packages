/**
 * Log severities understood by the bundled logger implementations.
 *
 * @example
 * ```ts
 * import { LogLevel } from '@mpen/logger'
 * import { JsonLogger } from '@mpen/logger'
 *
 * const logger = new JsonLogger({ minLogLevel: LogLevel.WARN })
 * logger.info('hidden')
 * logger.warn('visible')
 * ```
 */
export enum LogLevel {
    /**
     * Debug-level messages, used by [`Logger.log`]{@link Logger#log}.
     */
    DEBUG = 'debug',
    /**
     * Informational messages, used by [`Logger.info`]{@link Logger#info}.
     */
    INFO = 'info',
    /**
     * Warning messages, used by [`Logger.warn`]{@link Logger#warn}.
     */
    WARN = 'warning',
    /**
     * Error messages, used by [`Logger.error`]{@link Logger#error}.
     */
    ERROR = 'error',
}

/**
 * Numeric severity ordering for [`LogLevel`]{@link LogLevel} values.
 *
 * @example
 * ```ts
 * import { LogLevel, LogLevelValues } from '@mpen/logger'
 *
 * const isWarningOrHigher = LogLevelValues[LogLevel.ERROR] >= LogLevelValues[LogLevel.WARN]
 * ```
 */
export const LogLevelValues = Object.freeze({
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
} satisfies Record<LogLevel, number>)

/**
 * Common logging surface implemented by this package's loggers.
 *
 * @example
 * ```ts
 * import type { Logger } from '@mpen/logger'
 *
 * export function reportReady(logger: Logger): void {
 *     logger.info('ready')
 * }
 * ```
 */
export interface Logger {
    /**
     * Writes a debug-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    log(...data: any[]): void
    /**
     * Writes an info-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    info(...data: any[]): void
    /**
     * Writes a warning-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    warn(...data: any[]): void
    /**
     * Writes an error-level message.
     *
     * @param data - Values to include in the log record.
     * @returns Nothing.
     */
    error(...data: any[]): void
    /**
     * Writes tabular data.
     *
     * @param tabularData - Data to render as rows.
     * @param properties - Optional property names to include and order.
     * @returns Nothing.
     */
    table(tabularData?: any, properties?: string[]): void
}

// export interface WriteStream {
//     write: WriteFn
// }

/**
 * Receives a formatted log buffer.
 *
 * @param buffer - Text to write.
 * @returns Nothing.
 *
 * @example
 * ```ts
 * import type { WriteFn } from '@mpen/logger'
 *
 * const write: WriteFn = (buffer) => process.stdout.write(buffer)
 * ```
 */
export type WriteFn = (buffer: string) => void
