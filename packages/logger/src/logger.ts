


export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warning',
    ERROR = 'error',
}

export const LogLevelValues = Object.freeze({
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
} satisfies Record<LogLevel, number>)

export interface Logger {
    log(...data: any[]): void
    info(...data: any[]): void
    warn(...data: any[]): void
    error(...data: any[]): void
    table(tabularData?: any, properties?: string[]): void
}

// export interface WriteStream {
//     write: WriteFn
// }

export type WriteFn = (buffer: string) =>void
