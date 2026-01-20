import type {AnyContext, ContextMiddleware} from '..'
import {randomUUID} from 'node:crypto'
import {inspect} from 'node:util'
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
    data?: any[]
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
    const { timestamp, level, path, message, data, context } = entry;
    const date = new Date(timestamp);
    const timeStr = date.toISOString().replace('T', ' ').replace('Z', '');
    
    const levelColors: Record<LogLevel, typeof chalk> = {
        [LogLevel.TRACE]: chalk.gray,
        [LogLevel.DEBUG]: chalk.blue,
        [LogLevel.INFO]: chalk.green,
        [LogLevel.WARN]: chalk.yellow,
        [LogLevel.ERROR]: chalk.red,
        [LogLevel.FATAL]: chalk.bgRed.white,
    };

    const levelStr = level.toUpperCase().padEnd(5);
    const coloredLevel = levelColors[level] ? levelColors[level](levelStr) : levelStr;
    
    const pathStr = path && path.length > 0 ? chalk.gray(`[/${path.join('/')}]`) : '';
    const msgStr = message ? message : '';
    
    let dataStr = '';
    if (data !== undefined) {
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
            if (item instanceof Error) {
                dataStr += '\n' + chalk.bgRed.white(` ${item.name} `) + ' ' + item.message + '\n' + chalk.gray(item.stack || '');
            } else if (typeof item === 'object' && item !== null && Object.keys(item).length > 0) {
                dataStr += '\n' + inspect(item, { colors: true, depth: null });
            } else {
                const inspected = inspect(item, { colors: true });
                if (inspected !== '{}') {
                    dataStr += ' ' + inspected;
                }
            }
        }
    }

    console.log(`${chalk.gray(timeStr)} ${coloredLevel} ${pathStr} ${msgStr}${dataStr}`);
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

    private _log(level: LogLevel, data: any[]) {
        const spanId = randomUUID()
        const entry: LogEntry = {
            span_id: spanId,
            context: {...this._context},
            level,
            timestamp: Date.now(),
            path: this._path,
        }
        if(this._parentEntry) entry.parent_span_id = this._parentEntry.span_id
        if(data.length === 1 && typeof data[0] === 'string') {
            entry.message = data[0]
        } else {
            entry.data = data
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
