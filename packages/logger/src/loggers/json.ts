import type { Logger, WriteFn } from '../logger.ts'
import { LogLevel, LogLevelValues } from '../logger.ts'
import { jsonAscii } from '../json.ts'
import { getTableColumns, toTableRows } from '../table.ts'

interface JsonLoggerOptions {
    writeLine: WriteFn
    minLogLevel?: LogLevel
}

export class JsonLogger implements Logger {
    private readonly _writeLn: WriteFn
    private readonly _minLogLevel: number

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

    log(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.DEBUG, data)
    }
    info(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.INFO, data)
    }
    warn(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.WARN, data)
    }
    error(...data: any[]): void {
        this._maybeWriteWithLevel(LogLevel.ERROR, data)
    }
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
