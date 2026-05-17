import type { Logger } from '../logger.ts'
import { LogLevel, LogLevelValues } from '../logger.ts'

/**
 * Console-like target used by [`BrowserLogger`]{@link BrowserLogger}.
 *
 * @example
 * ```ts
 * import { BrowserLogger, type BrowserConsole } from '@mpen/logger/browser'
 *
 * const target: BrowserConsole = window.console
 * const logger = new BrowserLogger({ console: target })
 * ```
 */
export interface BrowserConsole {
    /**
     * Writes a debug-level message.
     *
     * @param data - Values to write.
     * @returns Nothing.
     */
    log(...data: any[]): void
    /**
     * Writes an info-level message.
     *
     * @param data - Values to write.
     * @returns Nothing.
     */
    info(...data: any[]): void
    /**
     * Writes a warning-level message.
     *
     * @param data - Values to write.
     * @returns Nothing.
     */
    warn(...data: any[]): void
    /**
     * Writes an error-level message.
     *
     * @param data - Values to write.
     * @returns Nothing.
     */
    error(...data: any[]): void
    /**
     * Writes tabular data when supported by the target console.
     *
     * @param tabularData - Data to render as rows.
     * @param properties - Optional property names to include and order.
     * @returns Nothing.
     */
    table?(tabularData?: any, properties?: string[]): void
}

/**
 * Options for [`BrowserLogger`]{@link BrowserLogger}.
 *
 * @example
 * ```ts
 * import { LogLevel } from '@mpen/logger'
 * import { BrowserLogger, type BrowserLoggerOptions } from '@mpen/logger/browser'
 *
 * const options: BrowserLoggerOptions = { minLogLevel: LogLevel.INFO }
 * const logger = new BrowserLogger(options)
 * ```
 */
export interface BrowserLoggerOptions {
    /**
     * Console target to write to.
     */
    console?: BrowserConsole
    /**
     * Lowest severity to write.
     */
    minLogLevel?: LogLevel
}

const RESET_STYLE = 'color:inherit;font:inherit;background:inherit;'
const TOKENS = {
    keyword: 'color:rgb(170, 13, 145);font-weight:bold;',
    string: 'color:#AB2C29;',
    number: 'color:rgb(28, 0, 207);',
    className: 'color:#6F00CF;',
    functionName: 'color:#CC7832;',
    propertyKey: 'color:rgb(136, 19, 145);font-weight:bold;',
    propertyName: 'color:rgb(136, 19, 145);',
    bracket: 'color:rgb(33, 33, 33);',
    punctuation: 'color:rgb(44, 44, 44);',
    constant: 'color:rgb(170, 13, 145);',
    undefined: 'color:rgb(128, 128, 128);font-style:italic;',
    null: 'color:#606060;',
    true: 'color:#469758;',
    false: 'color:#CC372C;',
    regexp: 'color:#AB8329;',
    function: 'background-color:#f3f3f3;color:#333;',
    circular: 'color:rgb(128, 128, 128);font-style:italic;',
}

/**
 * Writes styled log output to a browser DevTools console.
 *
 * @example
 * ```ts
 * const logger = new BrowserLogger()
 * logger.info('Loaded user', { id: 1, name: 'Ada' })
 * ```
 */
export class BrowserLogger implements Logger {
    private readonly _console: BrowserConsole
    private readonly _minLogLevel: number

    /**
     * Creates a browser logger.
     *
     * @param options - Optional console target and minimum log level.
     */
    constructor(options?: BrowserLoggerOptions) {
        this._console = options?.console ?? console
        this._minLogLevel =
            options?.minLogLevel == null ? -Infinity : LogLevelValues[options.minLogLevel]
    }

    /**
     * Writes a debug-level message.
     *
     * @param data - Values to write to the console.
     * @returns Nothing.
     */
    log(...data: any[]): void {
        this.write(LogLevel.DEBUG, 'log', data)
    }

    /**
     * Writes an info-level message.
     *
     * @param data - Values to write to the console.
     * @returns Nothing.
     */
    info(...data: any[]): void {
        this.write(LogLevel.INFO, 'info', data)
    }

    /**
     * Writes a warning-level message.
     *
     * @param data - Values to write to the console.
     * @returns Nothing.
     */
    warn(...data: any[]): void {
        this.write(LogLevel.WARN, 'warn', data)
    }

    /**
     * Writes an error-level message.
     *
     * @param data - Values to write to the console.
     * @returns Nothing.
     */
    error(...data: any[]): void {
        this.write(LogLevel.ERROR, 'error', data)
    }

    /**
     * Writes tabular data using the browser console's native table renderer.
     *
     * @param tabularData - Data to render as a table.
     * @param properties - Optional properties to include.
     * @returns Nothing.
     */
    table(tabularData?: any, properties?: string[]): void {
        if (!this.shouldWrite(LogLevel.DEBUG)) {
            return
        }

        if (this._console.table == null) {
            this.log(tabularData)
            return
        }

        this._console.table(tabularData, properties)
    }

    private write(level: LogLevel, method: 'log' | 'info' | 'warn' | 'error', data: any[]): void {
        if (!this.shouldWrite(level)) {
            return
        }

        this._console[method](...formatConsoleArguments(data))
    }

    private shouldWrite(level: LogLevel): boolean {
        return LogLevelValues[level] >= this._minLogLevel
    }
}

function formatConsoleArguments(data: unknown[]): unknown[] {
    return joinFormatted(
        data.map((value) => formatValue(value, 0, new WeakSet())),
        ' ',
    )
}

function formatValue(value: unknown, depth: number, seen: WeakSet<object>): unknown[] {
    if (Array.isArray(value)) {
        return formatArray(value, depth, seen)
    }

    if (value instanceof Set) {
        if (seen.has(value)) {
            return style`${TOKENS.circular}[Circular]`
        }

        if (value.size === 0) {
            return style`${TOKENS.keyword}new ${TOKENS.className}Set`
        }

        seen.add(value)

        const formattedValue = style`${TOKENS.keyword}new ${TOKENS.className}Set${
            TOKENS.bracket
        }(${formatValue([...value], depth + 1, seen)}${TOKENS.bracket})`

        seen.delete(value)

        return formattedValue
    }

    if (value instanceof Map) {
        if (seen.has(value)) {
            return style`${TOKENS.circular}[Circular]`
        }

        if (value.size === 0) {
            return style`${TOKENS.keyword}new ${TOKENS.className}Map`
        }

        seen.add(value)

        const formattedValue = style`${TOKENS.keyword}new ${TOKENS.className}Map${
            TOKENS.bracket
        }(${formatValue([...value], depth + 1, seen)}${TOKENS.bracket})`

        seen.delete(value)

        return formattedValue
    }

    if (value instanceof Date) {
        return style`${TOKENS.keyword}new ${TOKENS.className}Date${TOKENS.bracket}(${formatValue(
            value.getTime(),
            depth + 1,
            seen,
        )}${TOKENS.bracket})`
    }

    if (typeof value === 'symbol') {
        return formatSymbol(value)
    }

    if (typeof value === 'function') {
        return style(value.toString(), TOKENS.function)
    }

    if (value instanceof RegExp) {
        return style(value.toString(), TOKENS.regexp)
    }

    if (typeof value === 'number') {
        return formatNumber(value)
    }

    if (typeof value === 'bigint') {
        return style(`${value.toString()}n`, TOKENS.number)
    }

    if (value === true) {
        return style`${TOKENS.true}true`
    }

    if (value === false) {
        return style`${TOKENS.false}false`
    }

    if (typeof value === 'string') {
        return style(JSON.stringify(value), TOKENS.string)
    }

    if (value === undefined) {
        return style`${TOKENS.undefined}undefined`
    }

    if (value === null) {
        return style`${TOKENS.null}null`
    }

    if (isPromise(value)) {
        return style`${TOKENS.className}Promise`
    }

    if (typeof value === 'object') {
        return formatObject(value, depth, seen)
    }

    return style(String(value), TOKENS.constant)
}

function formatArray(value: unknown[], depth: number, seen: WeakSet<object>): unknown[] {
    if (seen.has(value)) {
        return style`${TOKENS.circular}[Circular]`
    }

    if (value.length === 0) {
        return style`${TOKENS.bracket}[]`
    }

    seen.add(value)

    const start = '\n' + '  '.repeat(depth + 1)
    const separator = ',\n' + '  '.repeat(depth + 1)
    const end = '\n' + '  '.repeat(depth)
    const entries: unknown[][] = []
    let hasProperty = false

    for (let index = 0; index < value.length; index++) {
        if (Object.prototype.hasOwnProperty.call(value, index)) {
            hasProperty = true
            entries.push(formatValue(value[index], depth + 1, seen))
        } else {
            entries.push(style``)
        }
    }

    seen.delete(value)

    if (!hasProperty) {
        return style`${TOKENS.keyword}new ${TOKENS.className}Array${TOKENS.bracket}(${formatValue(
            value.length,
            depth + 1,
            seen,
        )}${TOKENS.bracket})`
    }

    if (!Object.prototype.hasOwnProperty.call(value, value.length - 1)) {
        entries.push(style``)
    }

    return style`${TOKENS.bracket}[${style(start)}${joinFormatted(entries, separator)}${
        TOKENS.bracket
    }${style(end)}]`
}

function formatObject(value: object, depth: number, seen: WeakSet<object>): unknown[] {
    if (seen.has(value)) {
        return style`${TOKENS.circular}[Circular]`
    }

    const customSource = (value as { toSource?: unknown }).toSource

    if (typeof customSource === 'function') {
        return style(customSource.call(value))
    }

    const customJson = (value as { toJSON?: unknown }).toJSON

    if (typeof customJson === 'function') {
        seen.add(value)

        const formattedValue = formatValue(customJson.call(value), depth + 1, seen)

        seen.delete(value)

        return formattedValue
    }

    seen.add(value)

    const start = '\n' + '  '.repeat(depth + 1)
    const separator = ',\n' + '  '.repeat(depth + 1)
    const end = '\n' + '  '.repeat(depth)
    const entries = Reflect.ownKeys(value).map((key) => {
        return style`${formatPropertyName(key)}${TOKENS.punctuation}: ${formatValue(
            (value as Record<PropertyKey, unknown>)[key],
            depth + 1,
            seen,
        )}`
    })

    seen.delete(value)

    return style`${TOKENS.bracket}{${style(start)}${joinFormatted(entries, separator)}${
        TOKENS.bracket
    }${style(end)}}`
}

function formatNumber(value: number): unknown[] {
    switch (value) {
        case Math.E:
            return style`${TOKENS.className}Math${TOKENS.punctuation}.${TOKENS.propertyName}E`
        case Math.LN2:
            return style`${TOKENS.className}Math${TOKENS.punctuation}.${TOKENS.propertyName}LN2`
        case Math.LN10:
            return style`${TOKENS.className}Math${TOKENS.punctuation}.${TOKENS.propertyName}LN10`
        case Math.LOG2E:
            return style`${TOKENS.className}Math${TOKENS.punctuation}.${TOKENS.propertyName}LOG2E`
        case Math.PI:
            return style`${TOKENS.className}Math${TOKENS.punctuation}.${TOKENS.propertyName}PI`
        case Math.SQRT1_2:
            return style`${TOKENS.className}Math${TOKENS.punctuation}.${TOKENS.propertyName}SQRT1_2`
        case Math.SQRT2:
            return style`${TOKENS.className}Math${TOKENS.punctuation}.${TOKENS.propertyName}SQRT2`
        case Infinity:
            return style`${TOKENS.constant}Infinity`
        case -Infinity:
            return style`${TOKENS.constant}-Infinity`
    }

    if (Number.isNaN(value)) {
        return style`${TOKENS.constant}NaN`
    }

    return style(Object.is(value, -0) ? '-0' : String(value), TOKENS.number)
}

function formatSymbol(value: symbol): unknown[] {
    const key = Symbol.keyFor(value)

    if (key != null) {
        return style`${TOKENS.className}Symbol${TOKENS.punctuation}.${TOKENS.functionName}for${
            TOKENS.bracket
        }(${formatValue(key, 0, new WeakSet())}${TOKENS.bracket})`
    }

    const match = value.toString().match(/^Symbol\((.*)\)$/u)

    if (match != null) {
        return style`${TOKENS.className}Symbol${TOKENS.bracket}(${formatValue(
            match[1],
            0,
            new WeakSet(),
        )}${TOKENS.bracket})`
    }

    return style`${TOKENS.className}Symbol${TOKENS.bracket}()`
}

function formatPropertyName(name: PropertyKey): unknown[] {
    if (typeof name === 'symbol') {
        return style`${TOKENS.propertyKey}[${formatSymbol(name)}${TOKENS.propertyKey}]`
    }

    if (typeof name === 'string' && PROPERTY_NAME_PATTERN.test(name)) {
        return style(name, TOKENS.propertyKey)
    }

    return formatValue(name, 0, new WeakSet())
}

function style(strings: TemplateStringsArray | string, ...values: unknown[]): unknown[] {
    const text: string[] = []
    const styles: unknown[] = []

    if (!Array.isArray(strings)) {
        if (values.length === 0) {
            return [strings]
        }

        strings = ['', strings] as unknown as TemplateStringsArray
    }

    for (let index = 0; index < strings.length; index++) {
        text.push(strings[index].replaceAll('%', '%%'))

        if (index >= values.length) {
            continue
        }

        const value = values[index]

        if (Array.isArray(value)) {
            const [formattedText, ...formattedStyles] = value

            text.push(String(formattedText))
            styles.push(...formattedStyles)
        } else {
            text.push('%c')
            styles.push(value)
        }
    }

    return [text.join('') + '%c', ...styles, RESET_STYLE]
}

function joinFormatted(values: unknown[][], separator: string): unknown[] {
    const text: string[] = []
    const styles: unknown[] = []

    for (const [valueText, ...valueStyles] of values) {
        text.push(String(valueText))
        styles.push(...valueStyles)
    }

    return [text.join(separator), ...styles]
}

function isPromise(value: unknown): value is Promise<unknown> {
    return value instanceof Promise
}

const PROPERTY_NAME_PATTERN = /^[$_a-z][\w$]*$/iu
