import type { Logger, WriteFn } from '../logger.ts';
import  { LogLevel } from '../logger.ts'
import { jsonAscii } from '../json.ts'

interface JsonLoggerOptions {
    writeLine: WriteFn
}

export class JsonLogger implements Logger {
    private readonly _writeLn: WriteFn

    constructor(options?: JsonLoggerOptions) {
        this._writeLn = options?.writeLine ?? console.log.bind(console)
    }

    private _log(level: LogLevel, data: any[]) {
        this._writeLn(
            jsonAscii({
                level,
                time: new Date().toISOString(),
                ...(data.length === 1 && typeof data[0] === 'string'
                    ? { message: data[0] }
                    : { data }),
            }),
        )
    }

    log(...data: any[]): void {
        this._log(LogLevel.LOG, data)
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
        throw new Error('Method not implemented.')
    }
}
