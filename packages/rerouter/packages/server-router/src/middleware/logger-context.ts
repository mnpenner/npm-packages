import type {AnyContext, ContextMiddleware} from '..'

enum LogLevel {
    TRACE='trace',
    DEBUG='debug',
    INFO='info',
    WARN='warn',
    ERROR='error',
    FATAL='fatal',
}


interface LogEntry {
    level: LogLevel // or is "severity" better/more standard?
    message?: string
    data?: any
    timestamp: number
    context: Record<string,any>
    path: string[]
}

function consoleLogger(entry: LogEntry) {
    console.log(entry)
}

function jsonLogger(entry: LogEntry) {
    console.log(JSON.stringify(entry))
}

function prettyLogger(entry: LogEntry) {
    // TODO: format for terminal
}


type WriteLog = (entry: LogEntry) => void

export interface LoggerCtxOptions<Ctx extends object = AnyContext> {
    name?: string
    context?: Record<string,any>
    log?: WriteLog
}

class Logger {
    private _path: string[] = []
    private _context: Record<string,any> = {}
    private _write: WriteLog

    constructor(write: WriteLog, path:string[]=[],context:Record<string,any>={}) {
        this._write = write
        this._path = path
        this._context = context
    }

    withName(name: string) {
        return new Logger(this._write, [...this._path, name], this._context)
    }

    set(name: string, value: any) {
        this._context[name] = value
    }

    info(message: string):void
    info(...vars: any[]):void
    info(...vars: any[]) {
        this._log(LogLevel.INFO, vars)
    }

    warn(message: string):void
    warn(...vars: any[]):void
    warn(...vars: any[]) {
        this._log(LogLevel.WARN, vars)
    }

    // TODO: add other log levels

    private _log(level: LogLevel, vars: any) {
        const entry: LogEntry = {
            context: this._context,
            level,
            timestamp: Date.now(),
        }
        if(vars.length === 0 && typeof vars[0] === 'string') {
            entry.message = vars[0]
        } else {
            entry.data = vars
        }
        this._write(entry)
    }
}

export function loggerCtx<Ctx extends object = AnyContext>(
    options: LoggerCtxOptions<Ctx> = {}
): ContextMiddleware<{ logger: Logger }> {
    const log = options?.log ?? consoleLogger

    return ctx => {
        ctx.logger = new Logger(log, options.name ? [options.name] : [], options.context ?? Object.create(null))
    }
}
