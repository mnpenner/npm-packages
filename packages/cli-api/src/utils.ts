import type {AnyApp} from './interfaces'
import Path from 'path'
import stringWidth from 'string-width'
import type {ChalkInstance} from 'chalk'
import {EMPTY_ARRAY, FALSE_VALUES, TRUE_VALUES} from './constants'
import FileSys from 'fs'

export function print(str = ''): boolean {
    return process.stdout.write(str)
}

export function printLn(...args: unknown[]): void {
    console.log(...args)
}

export function printErrLn(...args: unknown[]): void {
    process.stderr.write(args.map(String).join(' ') + '\n')
}

export type nil = null | undefined
export type NullableObj = Record<string, any> | nil

/**
 * Semantic categories for user-facing CLI errors.
 */
export enum ErrorCategory {
    InvalidArg = 'invalid-arg',
    Misconfig = 'misconfig',
    Internal = 'internal',
}

/**
 * A user-facing CLI error with a semantic type.
 */
export interface CliError {
    message: string
    type: ErrorCategory
}

const ERROR_PRESENTATION: Record<ErrorCategory, {code: number, color: string}> = {
    [ErrorCategory.InvalidArg]: {code: 2, color: '#D73737'},
    [ErrorCategory.Misconfig]: {code: 254, color: '#B854D4'},
    [ErrorCategory.Internal]: {code: 253, color: '#6684E1'},
}

function blockError(str: string, style: ErrorCategory, chalk: ChalkInstance) {
    const lines = str.split('\n')
    const width = Math.max(...lines.map(l => stringWidth(l))) + 4
    const colorize = chalk.bgHex(ERROR_PRESENTATION[style].color).hex('#FEFBEC')
    printErrLn(colorize(space(width)))
    for(const line of lines) {
        const txt = `  ${line}`
        printErrLn(colorize(txt + space(width, txt)))
    }
    printErrLn(colorize(space(width)))
}

function inlineError(str: string) {
    printErrLn(`  ${str}`)
}

/**
 * Creates a structured CLI error.
 *
 * @param message The error text that should be rendered.
 * @param type The semantic error category used to determine presentation and exit code.
 * @returns A structured CLI error object.
 */
export function createError(message: string, type: ErrorCategory): CliError {
    return {message, type}
}

/**
 * Gets the process exit code associated with a given CLI error.
 *
 * @param error The structured CLI error to map to a process exit code.
 * @returns The default exit code used for that error type.
 */
export function getErrorExitCode(error: CliError): number {
    return ERROR_PRESENTATION[error.type].code
}

/**
 * Prints a user-facing CLI error block.
 *
 * @param error The structured CLI error to render.
 * @returns Nothing.
 */
export function printError(error: CliError, chalk: ChalkInstance): void {
    if(chalk.level > 0) {
        blockError(error.message, error.type, chalk)
        return
    }
    inlineError(error.message)
}

export function toArray<T>(x: T | readonly T[] | undefined): readonly T[] {
    if(!x) return EMPTY_ARRAY
    if(Array.isArray(x)) return x
    return [x as T]
}

export function resolve<T>(x: any): T {
    return typeof x === 'function' ? x() : x
}

export function toBool(str: string | boolean): boolean {
    if(typeof str === 'boolean') return str
    str = String(str).trim().toLowerCase()
    if(TRUE_VALUES.has(str)) {
        return true
    }
    if(FALSE_VALUES.has(str)) {
        return false
    }
    throw new Error(`Could not cast "${str}" to boolean`)
}

export function space(len: number, str?: string) {
    if(str) {
        len -= stringWidth(str)
    }

    return len > 0 ? ' '.repeat(len) : ''
}

export function getTerminalWidth(): number {
    return process.stdout.columns && process.stdout.columns > 0 ? process.stdout.columns : 80
}

export function wrapText(text: string, width: number): string[] {
    if(width <= 0) {
        return text.split('\n')
    }

    const wrappedLines: string[] = []
    for(const rawLine of text.split('\n')) {
        if(rawLine.trim().length === 0) {
            wrappedLines.push('')
            continue
        }

        const words = rawLine.trim().split(/\s+/)
        let currentLine = ''
        for(const word of words) {
            const candidate = currentLine.length === 0 ? word : `${currentLine} ${word}`
            if(currentLine.length > 0 && stringWidth(candidate) > width) {
                wrappedLines.push(currentLine)
                currentLine = word
            } else {
                currentLine = candidate
            }
        }

        if(currentLine.length > 0) {
            wrappedLines.push(currentLine)
        }
    }

    return wrappedLines
}

export function getProcName(app: AnyApp) {
    const bin = app._bin
    if(bin != null) {
        return bin
    }
    const relPath = Path.relative(process.cwd(), process.argv[1])
    // console.log(relPath, process.argv[1])
    // console.log(process.argv0,process.argv[0])
    return `${Path.basename(process.argv[0])} ${relPath.length < process.argv[1].length ? relPath : process.argv[1]}`
}

export function includes(needle: string, haystack: string | string[] | undefined) {
    if(!haystack) return false
    if(Array.isArray(haystack)) return haystack.includes(needle)
    return needle === haystack
}

export function statSync(path: string): FileSys.Stats | null {
    try {
        return FileSys.lstatSync(path)
    } catch {
        return null
    }
}

export function sortBy<T>(arr: readonly T[], cmp: (x: T) => string): T[] {
    const collator = new Intl.Collator() // 'en',{usage: 'sort',sensitivity:'base'}
    const values = arr.map(cmp)
    const keys = Array.from(arr.keys())
    keys.sort((a, b) => collator.compare(values[a], values[b]))
    return keys.map(i => arr[i])
}
