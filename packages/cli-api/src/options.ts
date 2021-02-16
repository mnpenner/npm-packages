import {AnyOptType, Command, Option, OptType} from './interfaces'
import {abort, includes, resolve, statSync, toArray, toBool} from './utils'
import Chalk from 'chalk'
import Path from 'path'
import FileSys from 'fs'

export function formatOption(opt: Option): [string, string] {
    const aliases: string[] = []
    if (opt.alias) {
        if (Array.isArray(opt.alias)) {
            aliases.push(...opt.alias)
        } else {
            aliases.push(opt.alias)
        }
    }
    aliases.push(opt.name)
    let flags = aliases.map(a => Chalk.green(a.length === 1 ? `-${a}` : `--${a}`)).join(', ')
    let valuePlaceholder = getValuePlaceholder(opt)
    if (opt.type !== OptType.BOOL) {
        flags += `=${valuePlaceholder}`
    }
    let desc = opt.description ?? ''
    let defaultValueText = opt.defaultValueText
    if (defaultValueText === undefined && opt.defaultValue !== undefined) {
        defaultValueText = JSON.stringify(resolve(opt.defaultValue))
    }
    if (defaultValueText !== undefined) {
        desc += Chalk.yellow(` [default: ${defaultValueText}]`)
    }
    return [flags, desc]
}

export function getValuePlaceholder(opt: Option): string {
    if (opt.valuePlaceholder !== undefined) {
        return opt.valuePlaceholder
    }
    if (Array.isArray(opt.type)) {
        return opt.type.join('|')
    } else if (opt.type == OptType.BOOL) {
        return JSON.stringify(!resolve(opt.defaultValue))
    } else if (opt.type === OptType.INT || opt.type === OptType.FLOAT) {
        return '#'
    } else if (opt.type === OptType.INPUT_FILE || opt.type === OptType.OUTPUT_FILE) {
        return 'FILE'
    } else if (opt.type === OptType.INPUT_DIRECTORY || opt.type === OptType.OUTPUT_DIRECTORY || opt.type === OptType.EMPTY_DIRECTORY) {
        return 'DIR'
    } else {
        return opt.name
    }
}

export function getOptions(cmd: Command): Option[] {
    return [
        ...toArray(cmd.options),
        ...toArray(cmd.flags).map(f => ({
            ...f,
            valueNotRequired: true,
            type: OptType.BOOL,

        }))
    ] as Option[]
}

export function parseArgs(cmd: Command, argv: string[]): [any[], Record<string, any>] {
    const args: any[] = []
    const opts: Record<string, any> = Object.create(null)
    let parseFlags = true
    // TODO: initialize all repeatables to empty arrays

    const allOptions = getOptions(cmd)

    let argIdx = 0
    for (let i = 0; i < argv.length; ++i) {
        let arg = argv[i]

        if (parseFlags && arg === '--') {
            parseFlags = false
            continue
        }

        if (parseFlags && arg.length >= 2 && arg.startsWith('-')) {
            let name: string
            let value: any
            if (arg.includes('=')) {
                [arg, value] = arg.split('=', 2)
            } /*else if(i < argv.length - 2 && argv[i+1] === '=') {
                value = argv[i+2]
                i += 2
            }*/
            if (arg.startsWith('--')) {
                name = arg.slice(2)
            } else {
                if (arg.length > 2) {
                    if (value !== undefined) {
                        abort(`Malformed option "${arg}"`)
                    }
                    value = arg.slice(2)
                    arg = arg.slice(0, 2)
                }
                name = arg.slice(1)
                // TODO: parse multiple single-char flags
            }

            const opt = allOptions.find(opt => opt.name === name || includes(name, opt.alias))
            if (!opt) {
                abort(`"${cmd.name}" command does not have option "${name}".`)
            }
            if (value === undefined) {
                if (opt.valueNotRequired) {
                    value = !resolve(opt.defaultValue)
                } else if (i < argv.length - 1) {
                    value = argv[++i]
                } else {
                    abort(`Missing required value for option "${arg}"`)
                }
            }
            if (opt.type != null) {
                value = coerceType(value, opt.type)
            }
            opts[opt.key ?? opt.name] = value
        } else {
            // TODO: examine cmd.arguments
            let value: any = arg

            if (cmd.arguments && cmd.arguments.length > argIdx) {
                const cmdArg = cmd.arguments[argIdx]
                if (cmdArg.type != null) {
                    value = coerceType(value, cmdArg.type)
                }
                if (cmdArg.key) {
                    opts[cmdArg.key] = value
                }
            }
            args.push(value)
            ++argIdx
        }
    }

    if (allOptions.length) {
        for (const opt of allOptions) {
            const k = opt.key ?? opt.name
            if (opts[k] === undefined) {
                if (opt.defaultValue !== undefined) {
                    opts[k] = resolve(opt.defaultValue)
                } else if (opt.required) {
                    throw new Error(`"${getOptName(opt)}" option is required`)
                } else {
                    // TODO: should we fill in undefined options? with `null` or `undefined`?
                }
            }
        }
    }

    if (cmd.arguments?.length) {
        for (let i = 0; i < cmd.arguments.length; ++i) {
            if (cmd.arguments[i].required && argIdx <= i) {
                throw new Error(`"${cmd.arguments[i].name}" argument is required`)
            }
        }
    }

    // TODO: fill global options into opts
    // TODO: fill flags into opts
    // TODO: copy named arguments into opts too
    return [args, opts]
}

function coerceType(value: string, type: AnyOptType) {
    if (Array.isArray(type)) {
        // TODO: search for closest match of value in type or throw error
        return String(value).trim().toLowerCase()
    }
    switch (type) {
        case OptType.BOOL:
            return toBool(value)
        case OptType.INT:
            return Math.trunc(Number(value))
        case OptType.FLOAT:
            return Number(value)
        case OptType.ENUM:
            return String(value).trim().toLowerCase()
        case OptType.STRING:
            return String(value)
        case OptType.INPUT_FILE: {
            if (value === '-') return '/dev/stdin'    // TODO: support windows
            const file = Path.normalize(value)
            const fullPath = Path.resolve(file)
            const stat = statSync(file)
            if (!stat) {
                throw new Error(`File ${Chalk.underline(fullPath)} does not exist`)
            }
            if (!stat.isFile()) {
                throw new Error(`${Chalk.underline(fullPath)} is not a file`)
            }
            try {
                FileSys.accessSync(file, FileSys.constants.R_OK)
            } catch (err) {
                throw new Error(`${Chalk.underline(fullPath)} is not readable`)
            }
            return file
        }
        case OptType.INPUT_DIRECTORY:
            const dir = Path.normalize(value)
            FileSys.accessSync(dir, FileSys.constants.X_OK)
            return dir
        case OptType.OUTPUT_FILE: {
            if (value === '-') return '/dev/stdout'  // TODO: support windows
            const file = Path.normalize(value)
            const stat = statSync(file)
            if (stat) {
                if (!stat.isFile()) {
                    throw new Error(`'${file}' is not a file`)
                }
                // if((stat.mode & 0x222) === 0) { // TODO: does this work?
                //     throw new Error(`'${value}' is not writeable`);
                // }
                FileSys.accessSync(file, FileSys.constants.W_OK)
            } else {
                FileSys.accessSync(Path.dirname(file), FileSys.constants.W_OK)
            }
            return file
        }
        case OptType.OUTPUT_DIRECTORY: {
            FileSys.accessSync(value, FileSys.constants.W_OK)
            return Path.normalize(value)
        }
        case OptType.EMPTY_DIRECTORY: {
            const dir = Path.normalize(value)
            let files = []
            try {
                files = FileSys.readdirSync(dir)
            } catch (err) {
                if (err.code === 'ENOENT') {
                    FileSys.accessSync(Path.dirname(dir), FileSys.constants.W_OK)
                } else {
                    throw err
                }
            }
            if (files.length) {
                throw new Error(`${Chalk.underline(dir)} is not empty`)
            }
            return dir
        }
    }
    return value
}


export function getOptName(opt: Option) {
    return (opt.name.length > 1 ? '--' : '-') + opt.name
}
