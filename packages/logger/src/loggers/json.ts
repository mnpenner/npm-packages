import type { Logger, WriteFn } from '../logger.ts'
import { LogLevel, LogLevelValues } from '../logger.ts'
import { jsonAscii } from '../json.ts'
import { getTableColumns, toTableRows } from '../table.ts'

/**
 * Options for [`JsonLogger`]{@link JsonLogger}.
 *
 * @example
 * ```ts
 * import { LogLevel } from '@mpen/logger'
 * import { JsonLogger, type JsonLoggerOptions } from '@mpen/logger'
 *
 * const options: JsonLoggerOptions = {
 *     minLogLevel: LogLevel.INFO,
 *     writeLine: (line) => process.stdout.write(line + '\n'),
 * }
 * const logger = new JsonLogger(options)
 * ```
 */
export interface JsonLoggerOptions {
    /**
     * Receives each serialized JSON record.
     */
    writeLine?: WriteFn
    /**
     * Lowest severity to write.
     */
    minLogLevel?: LogLevel
}

/**
 * Writes newline-delimited JSON log records.
 *
 * @example
 * ```ts
 * import { JsonLogger } from '@mpen/logger'
 *
 * const logger = new JsonLogger()
 * logger.info('server started')
 * logger.table([{ id: 1, status: 'ok' }])
 * ```
 */
export class JsonLogger implements Logger {
    private readonly _writeLn: WriteFn
    private readonly _minLogLevel: number

    /**
     * Creates a JSON logger.
     *
     * @param options - Optional output and filtering settings.
     */
    constructor(options?: JsonLoggerOptions) {
        this._writeLn = options?.writeLine ?? console.log.bind(console)
        this._minLogLevel =
            options?.minLogLevel == null ? -Infinity : LogLevelValues[options.minLogLevel]
    }

    private _doWriteWithTime(record: Record<string, unknown>) {
        this._writeLn(
            jsonAscii({
                time: new Date().toISOString(),
                ...record,
            }),
        )
    }

    private _maybeWriteWithLevel(level: LogLevel, data: any[]) {
        if (!this._shouldWrite(level)) {
            return
        }

        this._doWriteWithTime({
            level,
            ...(data.length === 1 && typeof data[0] === 'string' ? { message: data[0] } : { data }),
        })
    }

    private _shouldWrite(level: LogLevel): boolean {
        return LogLevelValues[level] >= this._minLogLevel
    }

    /**
     * Writes a debug-level JSON record.
     *
     * @param data - Values to serialize.
     * @returns Nothing.
     */
    log(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.DEBUG, data)
    }
    /**
     * Writes an info-level JSON record.
     *
     * @param data - Values to serialize.
     * @returns Nothing.
     */
    info(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.INFO, data)
    }
    /**
     * Writes a warning-level JSON record.
     *
     * @param data - Values to serialize.
     * @returns Nothing.
     */
    warn(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.WARN, data)
    }
    /**
     * Writes an error-level JSON record.
     *
     * @param data - Values to serialize.
     * @returns Nothing.
     */
    error(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.ERROR, data)
    }
    /**
     * Writes tabular data as a structured JSON table record.
     *
     * @param tabularData - Data to render as rows.
     * @param properties - Optional property names to include and order.
     * @returns Nothing.
     */
    table(tabularData?: any, properties?: string[]): void {
        if (!this._shouldWrite(LogLevel.DEBUG)) {
            return
        }

        const rows = toTableRows(tabularData, false)
        const columns = getTableColumns(rows, properties, false) as string[]

        this._doWriteWithTime({
            level: LogLevel.DEBUG,
            table: {
                properties: columns,
                values: rows.map((row) =>
                    columns.map((column) =>
                        Object.prototype.hasOwnProperty.call(row, column) ? row[column] : undefined,
                    ),
                ),
            },
        })
    }
}
