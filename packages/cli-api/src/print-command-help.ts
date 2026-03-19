import type {AnyApp, AnyCmd} from './interfaces'
import {OptType, hasSubCommands, isExecutable} from './interfaces'
import {printAvailableCommands} from './app-help'
import {getProcName, print, printLn, space, toArray} from './utils'
import Chalk from 'chalk'
import {formatOption, getOptions, getOptName, getValuePlaceholder} from './options'
import stringWidth from 'string-width'

function getCommandLabel(app: AnyApp, path: readonly string[]) {
    const proc = Chalk.cyan(getProcName(app))
    if (!path.length) {
        return proc
    }
    return `${proc} ${path.join(' ')}`
}

export function printCommandHelp(app: AnyApp, cmd: AnyApp | AnyCmd, path: readonly string[] = []) {
    if (cmd.description) {
        printLn(cmd.description)
        printLn()
    }

    printLn(Chalk.yellow('Usage:'))
    print(`  ${getCommandLabel(app, path)}`)

    if (hasSubCommands(cmd)) {
        print(` ${Chalk.gray('<')}command${Chalk.gray('>')}`)
    }

    if (isExecutable(cmd)) {
        const allOptions = getOptions(cmd)
        if (allOptions.length) {
            let otherOptions = 0
            for (const opt of allOptions) {
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
        if (cmd.positonals?.length) {
            print(` ${Chalk.grey('[')}--${Chalk.grey(']')}`)
            for (const arg of cmd.positonals) {
                print(' ')
                print(Chalk.grey(arg.required ? '<' : '['))
                if (arg.repeatable) {
                    print(Chalk.grey('...'))
                }
                print(arg.name)
                print(Chalk.grey(arg.required ? '>' : ']'))
            }
        }
    } else if (!hasSubCommands(cmd)) {
        print(` ${Chalk.gray('[options] [positionals]')}`)
    }
    printLn()

    if (isExecutable(cmd)) {
        const allOptions = getOptions(cmd)
        if (allOptions.length) {
            printLn(Chalk.yellow('\nOptions:'))
            const lines = allOptions.map(formatOption)
            const width = Math.max(...lines.map(l => stringWidth(l[0])))
            for (const line of lines) {
                printLn('  ' + line[0] + space(width + 2, line[0]) + line[1])
            }
        }

        if (cmd.positonals?.length) {
            printLn(Chalk.yellow('\nPositionals:'))
            const width = Math.max(...cmd.positonals.map((arg: {name: string}) => stringWidth(arg.name)))
            for (const arg of cmd.positonals) {
                print('  ' + Chalk.green(arg.name))
                if (arg.description) {
                    print(space(width + 2, arg.name) + arg.description)
                }
                printLn()
            }
        }
    }

    if (hasSubCommands(cmd)) {
        printLn()
        printAvailableCommands(cmd.subCommands, 'Sub-commands:')
    }

    if (cmd.alias) {
        const aliases = toArray(cmd.alias)
        printLn(Chalk.yellow(`\nAlias${aliases.length !== 1 ? 'es' : ''}: `) + aliases.join(Chalk.gray(', ')))
    }
    if (cmd.longDescription) {
        printLn(Chalk.yellow('\nDescription:'))
        printLn('  ' + cmd.longDescription)
    }
}
