import {exec} from 'node:child_process'
import chalk from 'chalk'
import {logJson, varDump} from './debug'
import {ErrPromise} from './promise'
import {ExecException} from 'child_process'
import assert from 'node:assert'

type CommandArg = string | number | CommandArg[]

const DASH_MAP = new Map([
    ["\x07",'\\a'],
    ["\x08",'\\b'],
    ["\x09",'\\t'],
    ["\x0A",'\\n'],
    ["\x0B",'\\v'],
    ["\x0C",'\\f'],
    ["\x0D",'\\r'],
])

function escapeDashString(obj: string) {
    if(!obj) return "''"
    return obj
        .replaceAll(/[^ a-zA-Z0-9._+:@%/-]+/ug, m => '"'+Array.from(m).map(c => DASH_MAP.get(c) ?? '\\0' + c.codePointAt(0)!.toString(8)).join('')+'"')
        .replaceAll(' ', '\\ ')
}

// for(let i=0; i<128; ++i)
// console.log(`[0x${i.toString(16).padStart(2,'0')},${JSON.stringify(String.fromCodePoint(i))}]`)
// const BASH_MAP = new Map<number, string>([
//   [0x07,'\\a'],
// ])

function escapeBashString(obj: string) {
    if(!obj) return "''"
    if(/^[a-zA-Z0-9._+:@%/-]+$/.test(obj)) {
        return obj
    }
    return "$'" + Array.from(obj).map(ch => {
        const cp = ch.codePointAt(0)!
        switch(cp) {
            // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
            // https://stackoverflow.com/a/27817504/65387
            case 0x07:
                return '\\a'
            case 0x08:
                return '\\b'
            case 0x09:
                return '\\t'
            case 0x0A:
                return '\\n'
            case 0x0B:
                return '\\v'
            case 0x0C:
                return '\\f'
            case 0x0D:
                return '\\r'
            case 0x1B:
                return "\\e"
            case 0x27:
                return "\\'"
            case 0x5C:
                return '\\\\'
        }
        if(cp >= 0x20 && cp <= 0x7E) {
            return ch
        }
        if(cp <= 0xFF) {
            return '\\x' + cp.toString(16).padStart(2, '0')
        }
        if(cp <= 0xFFFF) {
            return '\\u' + cp.toString(16).padStart(4, '0')
        }
        return '\\U' + cp.toString(16).padStart(8, '0')
    }).join('') + "'"
}

type StringEscapeFn = (str: string) => string
type ArgEscapeFn = (arg: CommandArg) => string

function escapeArg(str: CommandArg, escapeString: StringEscapeFn): string {
    if(Array.isArray(str)) {
        return str.map(s => escapeArg(s, escapeString)).join(' ')
    }
    if(typeof str === 'number') {
        return str.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    }
    if(typeof str === 'string') {
        return escapeString(str)
    }
    throw new Error(`Unsupported shell arg type: ${typeof str}`)
}

function escapeTemplate([cmdStart, ...cmdRest]: TemplateStringsArray, args: CommandArg[], escapeStr: StringEscapeFn) {
    assert(cmdRest.length === args.length)
    const out = [cmdStart]
    for(let i = 0; i < args.length; ++i) {
        out.push(escapeArg(args[i], escapeStr), cmdRest[i])
    }
    return out.join('')
}


const durationFormatter = new Intl.NumberFormat("en", {maximumFractionDigits: 1})

interface ExecError extends ExecException {
    stderr: string
    stdout: string
}


function execParse<T>(cmdParts: TemplateStringsArray, args: CommandArg[], parse: (stdout: string) => T) {
    return new ErrPromise<T, ExecError>((resolve, reject) => {
        const shell = process.env.SHELL || 'bash'
        // TODO: support PowerShell and cmd.exe
        const escaper = /(^|[/\\])(zsh|bash)$/.test(shell) ? escapeBashString : escapeDashString
        const cmd = escapeTemplate(cmdParts, args, escaper)
        process.stdout.write(chalk.greenBright('$') + ' ' + cmd) // TODO: colorize command

        const start = process.hrtime()

        const proc = exec(cmd, {shell}, (error, stdout, stderr) => {
            const [sec, ns] = process.hrtime(start)
            process.stdout.write('  ' + chalk.gray(durationFormatter.format(sec * 1000 + ns / 1e6) + 'ms') + '\n')

            if(error !== null) {
                if(stdout) console.log(chalk.gray(stdout))
                if(stderr) console.error(chalk.red(stderr.trimEnd()))

                const fixed = error as ExecError
                fixed.message = (error.message.endsWith(stderr)
                    ? error.message.slice(0, -stderr.length)
                    : error.message).trimEnd()
                fixed.stdout = stdout
                fixed.stderr = stderr

                return reject(fixed)
            }

            if(stderr) console.error(chalk.yellow(stderr.trimEnd()))
            resolve(parse(stdout))
        })
    })

    // TODO: maybe add .abort() and stuff to ErrPromise, rename to ExecPromise
    // and .ignore() to ignore failure statuses... which I guess is like .catch but it should restore the success
    // handler
}

/**
 * Escape a command, return it as a string. Useful for nesting commands to pass to subshells, ssh or kubectl.
 */
export function escBash(cmd: TemplateStringsArray, ...args: CommandArg[]): string {
    return escapeTemplate(cmd, args, s => escapeArg(s, escapeBashString))
}

export function escDash(cmd: TemplateStringsArray, ...args: CommandArg[]): string {
    return escapeTemplate(cmd, args, s => escapeArg(s, escapeDashString))
}

/**
 * Just get stdout as text. Trim trailing newline.
 */
export function txt(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => stdout.replace(/\n$/, ''))
}


/**
 * Split on newlines.
 */
export function nl(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => stdout.replace(/\n$/, '').split('\n'))
}

/**
 * Split on null-separators (\0)
 */
export function split0(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => stdout.replace(/\x00$/, '').split('\0'))
}

/**
 * Split on newlines and spaces.
 */
export function awk(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => stdout.replace(/\n$/, '').split('\n').map(line => line.trim().split(/\s+/g)))
}

/**
 * For debugging. Do not use.
 */
export function debug(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, varDump)
}

/**
 * Parse stdout as JSON.
 */
export function json(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => JSON.parse(stdout))
}


