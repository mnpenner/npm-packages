import type {AnyApp} from './interfaces'
import Path from 'path'
import stringWidth from 'string-width'
import type {ChalkInstance} from 'chalk'
import {EMPTY_ARRAY, FALSE_VALUES, TRUE_VALUES} from './constants'
import FileSys from 'fs'

export const print = process.stdout.write.bind(process.stdout)
export const printLn = console.log.bind(console)

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
    printLn(colorize(space(width)))
    for(const line of lines) {
        const txt = `  ${line}`
        printLn(colorize(txt + space(width, txt)))
    }
    printLn(colorize(space(width)))
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
    blockError(error.message, error.type, chalk)
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
