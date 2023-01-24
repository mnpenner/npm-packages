import {exec} from 'node:child_process'
import chalk from 'chalk'
import {logJson, varDump} from './debug'
import {ErrPromise} from './promise'
import {ExecException} from 'child_process'
import assert from 'node:assert'

type CommandArg = string | number | CommandArg[]

function escapeString(obj: string) {
    if(!obj) return "''"
    return "$'" + Array.from(obj).map(ch => {
        const cp = ch.codePointAt(0)!
        switch(cp) {
            // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
            case 0x07:
                return '\\a'
            case 0x08:
                return '\\b'
            case 0x0C:
                return '\\f'
            case 0x0A:
                return '\\n'
            case 0x0D:
                return '\\r'
            case 0x09:
                return '\\t'
            case 0x0B:
                return '\\v'
            // case 0x22: return '\\"'
            case 0x27:
                return "\\'"
            case 0x33:
                return "\\e"
            case 0x5C:
                return '\\\\'
        }
        if(cp >= 32 && cp <= 126) {
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

function escapeVar(str: CommandArg): string {
    if(Array.isArray(str)) {
        return str.map(s => escapeVar(s)).join(' ')
    }
    if(typeof str === 'number') {
        return str.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    }
    if(/^[0-9a-zA-Z_./]+$/.test(str)) {
        return str
    }
    return escapeString(str)
}

function escapeShellTemplate([cmdStart, ...cmdRest]: TemplateStringsArray, args: CommandArg[]) {
    assert(cmdRest.length === args.length)
    const out = [cmdStart]
    for(let i = 0; i < args.length; ++i) {
        out.push(escapeVar(args[i]), cmdRest[i])
    }
    return out.join('')
}

const durationFormatter = new Intl.NumberFormat("en", {maximumFractionDigits: 1})

interface ExecError extends ExecException {
    stderr: string
    stdout: string
}

function execParse<T>(cmdParts: TemplateStringsArray, args: CommandArg[], parse: (stdout: string) => T) {
    return new ErrPromise<T,ExecError>((resolve, reject) => {
        const cmd = escapeShellTemplate(cmdParts, args)
        process.stdout.write(chalk.greenBright('$') + ' ' + cmd) // TODO: colorize command

        const start = process.hrtime()
        const proc = exec(cmd, {shell: process.env.SHELL ?? 'bash'}, (error, stdout, stderr) => {
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

            if(stderr) console.error(chalk.gray(stderr.trimEnd()))
            resolve(parse(stdout))
        })
    })

    // TODO: maybe add .abort() and stuff to ErrPromise, rename to ExecPromise
    // and .ignore() to ignore failure statuses... which I guess is like .catch but it should restore the success handler
}

export function nl(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => stdout.replace(/\n$/,'').split('\n'))
}

export function nulls(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => stdout.replace(/\x00$/,'').split('\0'))
}

export function debug(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, varDump)
}

export function json(cmd: TemplateStringsArray, ...args: CommandArg[]) {
    return execParse(cmd, args, stdout => JSON.parse(stdout))
}


async function main(args: string[]): Promise<number | void> {
    const foo = await nl`echo ${"foo\nbar"}`
    console.log(foo)

    const pkg = await json`jq -c . package.json`
    console.log(pkg)

    const files = await nulls`find . -maxdepth 2 -type f -print0`
    console.log(files)
}


main(process.argv.slice(process.argv.findIndex(f => f === __filename) + 1))
    .then(exitCode => {
        if(typeof exitCode === 'number') {
            process.exitCode = exitCode
        }
    }, err => {
        if(err != null) {
            console.error(err)
        }
        process.exitCode = 255
    })
