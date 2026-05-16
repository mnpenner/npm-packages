


export enum LogLevel {
    INFO = 'info',
    WARN = 'warning',
    ERROR = 'error',
}


export interface Logger {
    log(...data: any[]): void
    info(...data: any[]): void
    warn(...data: any[]): void
    error(...data: any[]): void
    table(tabularData?: any, properties?: string[]): void
}

export interface WriteStream {
    write: WriteFn
}

export type WriteFn = (buffer: string) =>void
