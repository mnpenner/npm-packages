import type {AnyContext, ContextMiddleware} from '..'
import {randomUUID} from 'node:crypto'
import chalk from 'chalk'

const enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
}



// FIXME: Entries like "events" https://signoz.io/blog/opentelemetry-spans/#what-are-span-events
// "Spans" have a start and end time.
// the RequestLogger middleware can create a span... should it overwrite this logger with a Span entry?? Or add ctx.span? This is already associated with the request...
// We can maybe construct the spans after the fact? https://chatgpt.com/share/696f293e-d734-8000-8443-4af92a694e0c

interface LogEntry {  
    span_id: string
    parent_span_id?: string
    level: LogLevel // or is "severity" better/more standard?
    message?: string
    data?: any
    timestamp: number
    context: Record<string, any>
    path: string[]
}

const enum LogWriter {
    CONSOLE = 'console',
    PRETTY_CONSOLE = 'pretty_console',
    JSON = 'json',
    PRETTY_JSON = 'pretty_json',
}

const LOG_LEVEL_TO_VERBOSITY: Record<LogLevel, number> = {
    [LogLevel.TRACE]: 1,
    [LogLevel.DEBUG]: 2,
    [LogLevel.INFO]: 3,
    [LogLevel.WARN]: 4,
    [LogLevel.ERROR]: 5,
    [LogLevel.FATAL]: 6,
}
const DEFAULT_WRITERS: Record<LogWriter,WriteLogFn> = {
    [LogWriter.CONSOLE]: consoleLogger,
    [LogWriter.PRETTY_CONSOLE]: prettyConsoleLogger,
    [LogWriter.JSON]: jsonLogger,
    [LogWriter.PRETTY_JSON]: prettyJsonLogger,
}

function consoleLogger(entry: LogEntry) {
    console.log(entry)
}

function jsonLogger(entry: LogEntry) {
    console.log(JSON.stringify(entry))
}

function prettyJsonLogger(entry: LogEntry) {
    console.log(JSON.stringify(entry,null,2))
}

function prettyConsoleLogger(entry: LogEntry) {
    console.log('qqq',entry)
    // TODO: format for terminal
}


type WriteLogFn = (entry: LogEntry) => void

export interface LoggerCtxOptions<Ctx extends object = AnyContext> {
    name?: string
    context?: Record<string, any>
    log?: WriteLogFn|LogWriter
}

class Logger {
    private readonly _path: string[] = []
    private readonly _context: Record<string, any> = {}
    private readonly _write: WriteLogFn
    private readonly _parentEntry: LogEntry | null

    constructor(write: WriteLogFn, path: string[] = [], context: Record<string, any> = {}, parentEntry: LogEntry | null = null) {
        this._write = write
        this._path = path
        this._context = context
        this._parentEntry = parentEntry
    }

    withName(name: string) {
        return new Logger(this._write, [...this._path, name], this._context)
    }

    get context() {
        return this._context
    }

    get parentEntry() {
        return this._parentEntry
    }

    set(name: string, value: any) {
        this._context[name] = value
    }

    trace(...data: any[]) {
        return this._log(LogLevel.TRACE, data)
    }
    debug(...data: any[]) {
        return this._log(LogLevel.DEBUG, data)
    }
    info(...data: any[]) {
        return this._log(LogLevel.INFO, data)
    }
    warn(...data: any[]) {
        return this._log(LogLevel.WARN, data)
    }
    error(...data: any[]) {
        return this._log(LogLevel.ERROR, data)
    }
    fatal(...data: any[]) {
        return this._log(LogLevel.FATAL, data)
    }

    private _log(level: LogLevel, vars: any[]) {
        const spanId = randomUUID()
        const entry: LogEntry = {
            span_id: spanId,
            context: this._context,
            level,
            timestamp: Date.now(),
        }
        if(this._parentEntry) entry.parent_span_id = this._parentEntry.span_id
        if(vars.length === 0 && typeof vars[0] === 'string') {
            entry.message = vars[0]
        } else {
            entry.data = vars
        }
        this._write(entry)
        return new Logger(this._write, this._path, this._context, entry)
    }
}

export function loggerCtx<Ctx extends object = AnyContext>(
    options: LoggerCtxOptions<Ctx> = {}
): ContextMiddleware<{ logger: Logger }> {
    const logMode = options.log ?? LogWriter.PRETTY_CONSOLE
    const logFn = typeof logMode === 'function' ? logMode : DEFAULT_WRITERS[logMode]

    return ctx => {
        ctx.logger = new Logger(logFn, options.name ? [options.name] : [], options.context ?? Object.create(null))
        if(ctx.requestId) ctx.logger.set('request_id', ctx.requestId)
    }
}
