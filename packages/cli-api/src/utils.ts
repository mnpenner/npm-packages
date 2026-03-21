import type {AnyApp} from './interfaces'
import Path from 'path'
import stringWidth from 'string-width'
import Chalk from 'chalk'
import {EMPTY_ARRAY, FALSE_VALUES, TRUE_VALUES} from './constants'
import FileSys from 'fs'

export const print = process.stdout.write.bind(process.stdout)
export const printLn = console.log.bind(console)

export type nil = null | undefined
export type NullableObj = Record<string, any> | nil
type InternalAppMetadata = AnyApp & {_bin?: string}

enum ErrorColor {
    Red = 'red',
    Magenta = 'magenta',
    Blue = 'blue',
}

/**
 * Semantic categories for user-facing CLI errors.
 */
export enum ErrorStyle {
    InvalidArg = 'invalid-arg',
    Misconfig = 'misconfig',
    Internal = 'internal',
}

/** Backwards-compatible alias for the semantic CLI error categories. */
export const ErrorType = ErrorStyle

/**
 * A user-facing CLI error with a semantic type.
 */
export interface CliError {
    message: string
    type: ErrorStyle
}

const ERROR_PRESENTATION: Record<ErrorStyle, {code: number, color: ErrorColor}> = {
    [ErrorStyle.InvalidArg]: {code: 2, color: ErrorColor.Red},
    [ErrorStyle.Misconfig]: {code: 254, color: ErrorColor.Magenta},
    [ErrorStyle.Internal]: {code: 253, color: ErrorColor.Blue},
}

function getErrorBackground(color: ErrorColor): typeof Chalk.bgRed {
    if(color === ErrorColor.Magenta) {
        return Chalk.bgMagenta
    }
    if(color === ErrorColor.Blue) {
        return Chalk.bgBlue
    }
    return Chalk.bgRed
}

function blockError(str: string, style: ErrorStyle) {
    const lines = str.split('\n')
    const width = Math.max(...lines.map(l => stringWidth(l))) + 4
    const background = getErrorBackground(ERROR_PRESENTATION[style].color)
    printLn(background(space(width)))
    for(const line of lines) {
        const txt = `  ${line}`
        printLn(background(txt + space(width, txt)))
    }
    printLn(background(space(width)))
}

/**
 * Creates a structured CLI error.
 *
 * @param message The error text that should be rendered.
 * @param type The semantic error category used to determine presentation and exit code.
 * @returns A structured CLI error object.
 */
export function createError(message: string, type: ErrorStyle): CliError {
    return {message, type}
}

/**
 * Gets the process exit code associated with a given CLI error.
 *
 * @param error The structured CLI error or semantic error style to map to a process exit code.
 * @returns The default exit code used for that error type.
 */
export function getErrorExitCode(error: CliError): number
export function getErrorExitCode(error: ErrorStyle): number
export function getErrorExitCode(error: CliError | ErrorStyle): number {
    return ERROR_PRESENTATION[typeof error === 'string' ? error : error.type].code
}

/**
 * Prints a user-facing CLI error block.
 *
 * @param error The structured CLI error or message to render.
 * @param style The semantic error style to use when `error` is a plain string.
 * @returns Nothing.
 */
export function printError(error: CliError): void
export function printError(error: string, style?: ErrorStyle): void
export function printError(error: CliError | string, style: ErrorStyle = ErrorStyle.InvalidArg): void {
    if(typeof error === 'string') {
        blockError(error, style)
        return
    }
    blockError(error.message, error.type)
}

/**
 * Prints a user-facing CLI error block and exits the process.
 *
 * @param error The structured CLI error or message to render.
 * @param styleOrCode The semantic error style for string inputs, or an explicit exit code for structured errors.
 * @param code Optional explicit exit code override for string inputs.
 * @returns This function never returns because it exits the process.
 */
export function abort(error: CliError, code?: number): never
export function abort(error: string, style?: ErrorStyle, code?: number): never
export function abort(error: CliError | string, styleOrCode?: ErrorStyle | number, code?: number): never {
    if(typeof error === 'string') {
        const style = typeof styleOrCode === 'string' ? styleOrCode : ErrorStyle.InvalidArg
        printError(error, style)
        process.exit(code ?? (typeof styleOrCode === 'number' ? styleOrCode : getErrorExitCode(style)))
    }
    printError(error)
    process.exit(typeof styleOrCode === 'number' ? styleOrCode : getErrorExitCode(error))
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
    const bin = (app as InternalAppMetadata)._bin
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
