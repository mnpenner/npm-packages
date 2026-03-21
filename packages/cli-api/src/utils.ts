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

export enum ErrorStyle {
    InvalidArg = 'invalid-arg',
    Misconfig = 'misconfig',
    Internal = 'internal',
}

function getErrorBackground(style: ErrorStyle): typeof Chalk.bgRed {
    if(style === ErrorStyle.Misconfig) {
        return Chalk.bgMagenta
    }
    if(style === ErrorStyle.Internal) {
        return Chalk.bgBlue
    }
    return Chalk.bgRed
}

/**
 * Gets the process exit code associated with a given error style.
 *
 * @param style The error style to map to a process exit code.
 * @returns The default exit code used for that error style.
 */
export function getErrorExitCode(style: ErrorStyle): number {
    if(style === ErrorStyle.Misconfig) {
        return 254
    }
    if(style === ErrorStyle.Internal) {
        return 253
    }
    return 2
}

function blockError(str: string, style: ErrorStyle = ErrorStyle.InvalidArg) {
    const lines = str.split('\n')
    const width = Math.max(...lines.map(l => stringWidth(l))) + 4
    const background = getErrorBackground(style)
    printLn(background(space(width)))
    for(const line of lines) {
        const txt = `  ${line}`
        printLn(background(txt + space(width, txt)))
    }
    printLn(background(space(width)))
}

/**
 * Prints a user-facing CLI error block.
 *
 * @param message The error text to render.
 * @param style Optional styling variant used to distinguish invalid-argument, misconfiguration, and internal errors.
 * @returns Nothing.
 */
export function printError(message: string, style: ErrorStyle = ErrorStyle.InvalidArg): void {
    blockError(message, style)
}

/**
 * Prints a user-facing CLI error block and exits the process.
 *
 * @param message The error text to render.
 * @param style The style that controls the default exit code and visual treatment.
 * @param code Optional explicit exit code override.
 * @returns This function never returns because it exits the process.
 */
export function abort(message: string, style: ErrorStyle = ErrorStyle.InvalidArg, code: number = getErrorExitCode(style)): never {
    printError(message, style)
    process.exit(code)
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
