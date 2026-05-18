import type { Logger } from '@mpen/logger'


export class ConsoleLogger implements Logger {
    log(...data: any[]): void {
        console.log(...data)
    }
    info(...data: any[]): void {
        console.info(...data)
    }
    warn(...data: any[]): void {
        console.warn(...data)
    }
    error(...data: any[]): void {
        console.error(...data)
    }
    table(tabularData?: any, properties?: string[]): void {
        console.table(tabularData, properties)
    }
}
