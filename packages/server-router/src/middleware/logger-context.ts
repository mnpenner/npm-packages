import type {AnyContext, ContextMiddleware} from '..'
import {randomUUID} from 'node:crypto'
import {inspect} from 'node:util'
import path from 'node:path'
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
    filepath?: string
    line_no?: number
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
    // TODO: if request id is the same as last request, then show relative time, like +4ms.
    // TODO: colorize request IDs or maybe put a divider between requests
    const { timestamp, level, path, message, data, context, filepath, line_no } = entry;
    const { request_id } = context;
    const date = new Date(timestamp);
    const timeStr = date.toISOString().replace('T', ' ').replace('Z', '');

    type ChalkColor = typeof chalk.gray;
    const levelColors: Record<LogLevel, ChalkColor> = {
        [LogLevel.TRACE]: chalk.gray,
        [LogLevel.DEBUG]: chalk.blue,
        [LogLevel.INFO]: chalk.green,
        [LogLevel.WARN]: chalk.yellow,
        [LogLevel.ERROR]: chalk.red,
        [LogLevel.FATAL]: chalk.bgRed.white,
    };

    const levelStr = level.toUpperCase().padEnd(5);
    const coloredLevel = levelColors[level] ? levelColors[level](levelStr) : levelStr;
    const requestIdStr = request_id ? chalk.gray(` (${request_id})`) : '';

    const pathStr = path && path.length > 0 ? chalk.gray(`[/${path.join('/')}]`) : '';
    const locationStr = filepath ? chalk.gray(`${filepath}${line_no ? ':' + line_no : ''}`) : '';
    const msgStr = message ? message : '';

    let dataStr = '';
    if (data !== undefined) {
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
            if (item instanceof Error) {
                dataStr += '\n' + chalk.bgRed.white(` ${item.name} `) + ' ' + item.message + '\n' + chalk.gray(item.stack || '');
            } else if (typeof item === 'object' && item !== null && Object.keys(item).length > 0) {
                dataStr += '\n' + inspect(item, { colors: true, depth: 8, maxStringLength: 80 });
            } else {
                const inspected = inspect(item, { colors: true });
                if (inspected !== '{}') {
                    dataStr += ' ' + inspected;
                }
            }
        }
    }

    const firstLine = `${chalk.gray(timeStr)} ${coloredLevel}${requestIdStr} ${pathStr} ${locationStr} ${msgStr}`.trimEnd();

    if (dataStr) {
        // Indent subsequent lines
        const indent = ' '.repeat(2);
        const indentedData = dataStr.split('\n').map((line, i) => i === 0 ? line : indent + line).join('\n');
        console.log(firstLine + indentedData);
    } else {
        console.log(firstLine);
    }
}


type WriteLogFn = (entry: LogEntry) => void

export interface LoggerCtxOptions<Ctx extends object = AnyContext> {
    name?: string
    context?: Record<string, any>
    log?: WriteLogFn|LogWriter
    rootPath?: string
}

class Logger {
    private readonly _path: string[] = []
    private readonly _context: Record<string, any> = {}
    private readonly _write: WriteLogFn
    private readonly _parentEntry: LogEntry | null
    private readonly _rootPath: string

    constructor(write: WriteLogFn, path: string[] = [], context: Record<string, any> = {}, parentEntry: LogEntry | null = null, rootPath: string = process.cwd()) {
        this._write = write
        this._path = path
        this._context = context
        this._parentEntry = parentEntry
        this._rootPath = rootPath
    }

    withName(name: string) {
        return new Logger(this._write, [...this._path, name], this._context, null, this._rootPath)
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
            context: this._context,
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

        // Capture call site information
        const error = new Error()
        const stack = error.stack?.split('\n')
        if (stack) {
            // Skip stack frames until we're outside of current file
            for (let i = 1; i < stack.length; i++) {
                const line = stack[i]
                if (!line) continue
                const match = line.match(/\((.+):(\d+):\d+\)/) || line.match(/at (.+):(\d+):\d+/)
                if (match) {
                    let filepath = match[1]
                    if (!filepath || filepath === __filename) continue
                    if (path.isAbsolute(filepath)) {
                        filepath = path.relative(this._rootPath, filepath)
                    }
                    entry.filepath = filepath
                    if (match[2]) {
                        entry.line_no = parseInt(match[2], 10)
                    }
                }
                break
            }
        }

        this._write(entry)
        return new Logger(this._write, this._path, this._context, entry, this._rootPath)
    }
}

export function loggerCtx<Ctx extends object = AnyContext>(
    options: LoggerCtxOptions<Ctx> = {}
): ContextMiddleware<{ logger: Logger }> {
    const logMode = options.log ?? LogWriter.PRETTY_CONSOLE
    const logFn = typeof logMode === 'function' ? logMode : DEFAULT_WRITERS[logMode]
    const rootPath = options.rootPath ?? process.cwd()

    return ctx => {
        ctx.logger = new Logger(logFn, options.name ? [options.name] : [], options.context ?? Object.create(null), null, rootPath)
        if(ctx.requestId) ctx.logger.set('request_id', ctx.requestId)
    }
}
