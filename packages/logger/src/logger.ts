


export enum LogLevel {
    INFO = 'info',
    WARN = 'warning',
    ERROR = 'error',
}


export interface Logger {
    info(...data: any[]): void
    warn(...data: any[]): void
    error(...data: any[]): void
    table(tabularData?: any, properties?: string[]): void
}

export interface WriteStream {
    write(buffer: string): void
}
