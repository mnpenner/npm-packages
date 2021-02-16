import {App} from './interfaces'
import Path from 'path'
import stringWidth from 'string-width'
import Chalk from 'chalk'
import {EMPTY_ARRAY, FALSE_VALUES, TRUE_VALUES} from './constants'
import FileSys from 'fs'

export const print = process.stdout.write.bind(process.stdout)
export const printLn = console.log.bind(console)

function blockError(str: string) {
    const lines = str.split('\n')
    const width = Math.max(...lines.map(l => stringWidth(l))) + 4
    printLn(Chalk.bgRed(space(width)))
    for (const line of lines) {
        const txt = `  ${line}`
        printLn(Chalk.bgRed(txt + space(width, txt)))
    }
    printLn(Chalk.bgRed(space(width)))
}

export function abort(message: string, code: number = 1): never {
    blockError(message)
    process.exit(code)
}

export function toArray<T>(x: T | T[]): readonly T[] {
    if (!x) return EMPTY_ARRAY
    return Array.isArray(x) ? x : [x]
}

export function resolve<T>(x: any): T {
    return typeof x === 'function' ? x() : x
}

export function toBool(str: string | boolean): boolean {
    if (typeof str === 'boolean') return str
    str = String(str).trim().toLowerCase()
    if (TRUE_VALUES.has(str)) {
        return true
    }
    if (FALSE_VALUES.has(str)) {
        return false
    }
    throw new Error(`Could not cast "${str}" to boolean`)
}

export function space(len: number, str?: string) {
    if (str) {
        len -= stringWidth(str)
    }

    return len > 0 ? ' '.repeat(len) : ''
}

export function getProcName(app: App) {
    if (app.argv0 != null) {
        return app.argv0
    }
    const relPath = Path.relative(process.cwd(), process.argv[1])
    // console.log(relPath, process.argv[1])
    // console.log(process.argv0,process.argv[0])
    return `${Path.basename(process.argv[0])} ${relPath.length < process.argv[1].length ? relPath : process.argv[1]}`
}

export function includes(needle: string, haystack: string | string[] | undefined) {
    if (!haystack) return false
    if (Array.isArray(haystack)) return haystack.includes(needle)
    return needle === haystack
}

export function statSync(path: string): FileSys.Stats | null {
    try {
        return FileSys.lstatSync(path)
    } catch {
        return null
    }
}
