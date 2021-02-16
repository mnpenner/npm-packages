import {App, Command, OptType} from '../interfaces'
import {getProcName, includes, print, printLn, space, toArray} from '../utils'
import Chalk from 'chalk'
import {formatOption, getOptions, getOptName, getValuePlaceholder} from '../options'
import stringWidth from 'string-width'

export const helpCommand: Command = {
    name: 'help',
    description: "Displays help for a command",
    arguments: [
        {
            name: "command",
            description: "The command name.",
            required: true,
        }
    ],
    async execute(options: Record<string, string>, args: string[], app: App) {
        // console.log('exec help command',args,options)
        const cmd = getCommand(args[0], app)
        // console.log('found command',cmd)

        if (cmd.description) {
            printLn(cmd.description)
            printLn()
        }

        printLn(Chalk.yellow("Usage:"))
        print(`  ${Chalk.cyan(getProcName(app))} ${cmd.name}`)

        const allOptions = getOptions(cmd)

        if (allOptions.length) {
            let otherOptions = 0
            for (let opt of allOptions) {
                if (opt.required) {
                    print(` ${getOptName(opt)}`)
                    if (opt.type !== OptType.BOOL) {
                        print(`=${getValuePlaceholder(opt)}`)
                    }
                } else {
                    ++otherOptions
                }
            }
            if (otherOptions) {
                print(` ${Chalk.gray('[')}options${Chalk.gray(']')}`)
            }
        }
        if (cmd.arguments?.length) {
            print(` ${Chalk.grey('[')}--${Chalk.grey(']')}`)
            for (const arg of cmd.arguments) {
                print(' ')
                print(Chalk.grey(arg.required ? '<' : '['))
                if (arg.repeatable) {
                    print(Chalk.grey('...'))
                }
                print(arg.name)
                print(Chalk.grey(arg.required ? '>' : ']'))
            }
        }
        printLn()

        if (allOptions.length) {
            printLn(Chalk.yellow("\nOptions:"))
            const lines = allOptions.map(formatOption)
            const width = Math.max(...lines.map(l => stringWidth(l[0])))
            for (const line of lines) {
                printLn('  ' + line[0] + space(width + 2, line[0]) + line[1])
            }
        }

        if (cmd.arguments?.length) {
            printLn(Chalk.yellow("\nArguments:"))
            const width = Math.max(...cmd.arguments.map(a => stringWidth(a.name)))
            for (const arg of cmd.arguments) {
                print('  ' + Chalk.green(arg.name))
                if (arg.description) {
                    print(space(width + 2, arg.name) + arg.description)
                }
                printLn()
            }
        }

        if (cmd.alias) {
            const alaises = toArray(cmd.alias)
            printLn(Chalk.yellow(`\nAlias${alaises.length !== 1 ? 'es' : ''}: `) + toArray(cmd.alias).join(Chalk.gray(', ')))
        }
        if (cmd.longDescription) {
            printLn(Chalk.yellow("\nDescription:"))
            printLn('  ' + cmd.longDescription)
        }
    }
}

export function getCommand(name: string, app: App): Command {
    const cmdName = String(name).trim().toLowerCase()
    const cmd = app.commands.find((c: Command) => c.name === cmdName || includes(cmdName, c.alias))
    if (cmd === undefined) {
        throw new Error(`Command "${cmdName}" is not defined.`)
    }
    return cmd
}

