import type { Logger, WriteFn } from '../logger.ts'
import { LogLevel } from '../logger.ts'
import { jsonAscii } from '../json.ts'
import { getTableColumns, toTableRows } from '../table.ts'

interface JsonLoggerOptions {
    writeLine: WriteFn
}

export class JsonLogger implements Logger {
    private readonly _writeLn: WriteFn

    constructor(options?: JsonLoggerOptions) {
        this._writeLn = options?.writeLine ?? console.log.bind(console)
    }

    private _writeRecord(record: Record<string, unknown>) {
        this._writeLn(
            jsonAscii({
                time: new Date().toISOString(),
                ...record,
            }),
        )
    }

    private _log(level: LogLevel, data: any[]) {
        this._writeRecord({
            level,
            ...(data.length === 1 && typeof data[0] === 'string' ? { message: data[0] } : { data }),
        })
    }

    log(...data: any[]): void {
        this._log(LogLevel.DEBUG, data)
    }
    info(...data: any[]): void {
        this._log(LogLevel.INFO, data)
    }
    warn(...data: any[]): void {
        this._log(LogLevel.WARN, data)
    }
    error(...data: any[]): void {
        this._log(LogLevel.ERROR, data)
    }
    table(tabularData?: any, properties?: string[]): void {
        const rows = toTableRows(tabularData, false)
        const columns = getTableColumns(rows, properties, false) as string[]

        this._writeRecord({
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
