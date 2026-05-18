import type { Logger } from '@mpen/logger'

export class NullLogger implements Logger {
    log(...data: any[]): void {}
    info(...data: any[]): void {}
    warn(...data: any[]): void {}
    error(...data: any[]): void {}
    table(tabularData?: any, properties?: string[]): void {}
}
