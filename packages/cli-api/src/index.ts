import Chalk from 'chalk';
import stringWidth from 'string-width';
import Path from 'path';
import {App, Command, Option, OptType} from "./interfaces";
import * as fs from "fs";
import {Stats} from "fs";

const print = process.stdout.write.bind(process.stdout)
const printLn = console.log.bind(console)


function blockError(str: string) {
    const lines = str.split('\n')
    const width = Math.max(...lines.map(l => stringWidth(l))) + 4
    printLn(Chalk.bgRed(space(width)))
    for(const line of lines) {
        const txt = `  ${line}`
        printLn(Chalk.bgRed(txt+space(width,txt)));
    }
    printLn(Chalk.bgRed(space(width)))
}

function abort(message: string, code:number=1): never {
    blockError(message)
    process.exit(code)
}

const helpCommand: Command = {
    name: 'help',
    description: "Displays help for a command",
    arguments: [
        {
            name: "command",
            description: "The command name.",
            required: true,
        }
    ],
    async execute(options:Record<string, string>, args:string[], app:App) {
        // console.log('exec help command',args,options)
        const cmd = getCommand(args[0], app)
        // console.log('found command',cmd)

        if(cmd.description) {
            printLn(cmd.description)
            printLn()
        }

        printLn(Chalk.yellow("Usage:"))
        print(`  ${Chalk.cyan(getProcName(app))} ${cmd.name}`)
        if(cmd.options?.length) {
            let otherOptions = 0
            for(let opt of cmd.options) {
                if(opt.required) {
                    print(` ${getOptName(opt)}=${getValuePlaceholder(opt)}`)
                } else {
                    ++otherOptions
                }
            }
            if(otherOptions) {
                print(` ${Chalk.gray('[')}options${Chalk.gray(']')}`)
            }
        }
        if(cmd.arguments?.length) {
            print(` ${Chalk.grey('[')}--${Chalk.grey(']')}`)
            for(const arg of cmd.arguments) {
                print(' ')
                print(Chalk.grey(arg.required ? '<' : '['))
                if(arg.repeatable) {
                    print(Chalk.grey('...'))
                }
                print(arg.name)
                print(Chalk.grey(arg.required ? '>' : ']'))
            }
        }
        printLn('\n')

        if(cmd.arguments?.length) {
            printLn(Chalk.yellow("Arguments:"))
            const width = Math.max(...cmd.arguments.map(a => stringWidth(a.name)))
            for(const arg of cmd.arguments) {
                printLn('  '+Chalk.green(arg.name)+space(width+2,arg.name)+arg.description)
            }
        }

        if(cmd.options?.length) {
            printLn(Chalk.yellow("Options:"))
            const lines = cmd.options.map(formatOption)
            const width = Math.max(...lines.map(l => stringWidth(l[0])))
            for(const line of lines) {
                printLn('  '+line[0]+space(width+2,line[0])+line[1])
            }
        }
        if(cmd.longDescription) {
            printLn(Chalk.yellow("Description:"))
            printLn('  '+cmd.longDescription)
        }
    }
}

function formatOption(opt: Option): [string,string] {
    const aliases: string[] = []
    if(opt.alias) {
        if(Array.isArray(opt.alias)) {
            aliases.push(...opt.alias)
        } else {
            aliases.push(opt.alias)
        }
    }
    aliases.push(opt.name)
    let flags = aliases.map(a => Chalk.green(a.length === 1 ? `-${a}` : `--${a}`)).join(', ')
    let valuePlaceholder = getValuePlaceholder(opt)
    flags += `=${valuePlaceholder}`
    let desc = opt.description ?? ''
    let defaultValueText = opt.defaultValueText
    if(defaultValueText === undefined && opt.defaultValue !== undefined) {
        defaultValueText = JSON.stringify(resolve(opt.defaultValue))
    }
    if(defaultValueText !== undefined) {
        desc += Chalk.yellow(` [default: ${defaultValueText}]`)
    }
    return [flags,desc]
}

function getValuePlaceholder(opt: Option): string {
    if(opt.valuePlaceholder !== undefined) {
        return opt.valuePlaceholder;
    }
    if(Array.isArray(opt.type)) {
        return opt.type.join('|')
    } else if(opt.type == OptType.BOOL) {
        return JSON.stringify(!resolve(opt.defaultValue))
    } else if(opt.type === OptType.INT || opt.type === OptType.FLOAT) {
        return '#'
    } else {
        return opt.name
    }
}

function resolve<T>(x: any):T {
    return typeof x === 'function' ? x() : x
}

function getCommand(name: string, app: App): Command {
    const cmdName = String(name).trim().toLowerCase()
    const cmd = app.commands.find((c:Command) => c.name === cmdName || includes(cmdName,c.alias))
    if (cmd === undefined) {
        throw new Error(`Command "${cmdName}" is not defined.`)
    }
    return cmd
}

export default function run(app: App) {
    app = {
        ...app,
        commands: [...app.commands, helpCommand],
    }
    if (process.argv.length <= 2) {
        printHelp(app)
    } else {
        const cmd = getCommand(process.argv[2], app)
        const [args,opts] = parseArgs(cmd,process.argv.slice(3))
        Promise.resolve(cmd.execute(opts, args, app)).then(code => {
            if(code !== undefined) {
                process.exit(code)
            }
        }, err => {
            // console.error(err)
            abort(String(err.stack))
        })
    }
}



const EMPTY_ARRAY = []


function includes(needle:string,haystack:string|string[]|undefined) {
    if(!haystack) return false
    if(Array.isArray(haystack)) return haystack.includes(needle)
    return needle === haystack
}


function parseArgs(cmd:Command, argv: string[]): [any[],Record<string,any>] {
    const args: any[] = []
    const opts: Record<string,any> = Object.create(null)
    let parseFlags = true
    // TODO: initialize all repeatables to empty arrays

    for(let i=0; i<argv.length; ++i) {
        let arg = argv[i]

        if(parseFlags && arg === '--') {
            parseFlags = false
            continue
        }

        if(parseFlags && arg.length >= 2 && arg.startsWith('-')) {
            let name: string;
            let value: any;
            if(arg.includes('=')) {
                [arg,value] = arg.split('=',2)
            } /*else if(i < argv.length - 2 && argv[i+1] === '=') {
                value = argv[i+2]
                i += 2
            }*/
            if(arg.startsWith('--')) {
                name = arg.slice(2)
            } else {
                if(arg.length > 2) {
                    if(value !== undefined) {
                        abort(`Malformed option "${arg}"`)
                    }
                    value = arg.slice(2)
                    arg = arg.slice(0,2)
                }
                name = arg.slice(1)
                // TODO: parse multiple single-char flags
            }
            // TODO: stop interpretting as option after -- is found

            const opt = cmd.options && cmd.options.find(opt => opt.name === name || includes(name,opt.alias))
            if(!opt) {
                abort(`"${cmd.name}" command does not have option "${name}".`)
            }
            if(value === undefined) {
                if(i < argv.length - 1) {
                    value = argv[++i]
                } else {
                    abort(`Missing required value for option "${arg}"`)
                }
            }
            if(opt.type !== undefined) {
                if(typeof opt.type === 'function') {
                    value = opt.type(value)
                } else switch (opt.type) {
                    case OptType.BOOL:
                        value = toBool(value)
                        break;
                    case OptType.INT:
                        value = Math.trunc(Number(value))
                        break;
                    case OptType.FLOAT:
                        value = Number(value);
                        break;
                    case OptType.ENUM:
                        value = String(value).trim().toLowerCase();
                        break;
                    case OptType.STRING:
                        value = String(value)
                        break;
                    case OptType.INPUT_FILE:
                    case OptType.INPUT_DIRECTORY:
                        // TODO: support "-"
                        fs.accessSync(value, fs.constants.F_OK)
                        break;
                    case OptType.OUTPUT_FILE:
                        // TODO: support "-"
                        const stat = statSync(value)
                        if(stat) {
                            if(!stat.isFile()) {
                                throw new Error(`'${value}' is not a file`)
                            }
                            // if((stat.mode & 0x222) === 0) { // TODO: does this work?
                            //     throw new Error(`'${value}' is not writeable`);
                            // }
                            fs.accessSync(value, fs.constants.W_OK)
                        } else {
                            fs.accessSync(Path.dirname(value), fs.constants.W_OK)
                        }
                        break;
                    case OptType.OUTPUT_DIRECTORY:
                        fs.accessSync(value, fs.constants.W_OK)
                        break;
                }
            }
            opts[opt.key ?? opt.name] = value
        } else {
            // TODO: examine cmd.arguments
            args.push(arg);
        }
    }

    if(cmd.options?.length) {
        for (const opt of cmd.options) {
            const k = opt.key ?? opt.name
            if (opts[k] === undefined) {
                if(opt.defaultValue !== undefined) {
                    opts[k] = resolve(opt.defaultValue)
                } else if(opt.required) {
                    throw new Error(`"${getOptName(opt)}" option is required`)
                } else {
                    // TODO: should we fill in undefined options? with `null` or `undefined`?
                }
            }
        }
    }

    // TODO: fill global options into opts
    // TODO: fill flags into opts
    // TODO: copy named arguments into opts too
    return [args,opts]
}

function statSync(path: string): Stats|null {
    try {
        return fs.lstatSync(path)
    } catch {
        return null
    }
}

function getOptName(opt: Option) {
    return (opt.name.length > 1 ? '--' : '-') + opt.name
}

const TRUE_VALUES = new Set(['y','yes','t','true','1','on'])
const FALSE_VALUES = new Set(['n','no','f','false','0','off'])

function toBool(str: string): boolean {
    str = str.trim().toLowerCase()
    if(TRUE_VALUES.has(str)) {
        return true
    }
    if(FALSE_VALUES.has(str)) {
        return false
    }
    throw new Error(`Could not cast "${str}" to boolean`)
}

function space(len: number, str?: string) {
    if(str) {
        len -= stringWidth(str)
    }

    return len > 0 ? ' '.repeat(len) : ''
}

function getProcName(app: App) {
    if(app.argv0 != null) {
        return app.argv0;
    }
    const relPath = Path.relative(process.cwd(), process.argv[1])
    // console.log(relPath, process.argv[1])
    // console.log(process.argv0,process.argv[0])
    return `${Path.basename(process.argv[0])} ${relPath.length < process.argv[1].length ? relPath : process.argv[1]}`
}

function printHelp(app: App) {
    print(Chalk.green(app.name));
    if (app.version) {
        print(` version ${Chalk.yellow(app.version)}`)
    }
    print('\n\n')
    printLn(Chalk.yellow("Usage:"))
    printLn(`  ${Chalk.cyan(getProcName(app))} command ${Chalk.gray(`[options] [arguments]`)}\n`)

    if (app.globalOptions) {
        printLn("TODO")
    }

    printLn(Chalk.yellow("Available commands:"))
    const width = Math.max(...app.commands.map(c => stringWidth(c.name)))+2
    for (const cmd of app.commands) {
        printLn(`  ${Chalk.green(cmd.name)}${space(width,cmd.name)}${cmd.description}`)
    }

    printLn()
}
