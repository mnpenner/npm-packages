import type {AnyApp, AnyCmd} from './interfaces'
import {OptType, hasSubCommands, isExecutable} from './interfaces'
import {printAvailableCommands} from './app-help'
import {getProcName, print, printLn, space, toArray} from './utils'
import Chalk from 'chalk'
import {formatOption, getOptions, getOptName, getValuePlaceholder} from './options'
import stringWidth from 'string-width'
import type {Argument, Option} from './interfaces'

type InternalAppMetadata = AnyApp & {_author?: string}

const HELP_OPTION: Option = {
    name: 'help',
    alias: 'h',
    description: 'Show help text',
    type: OptType.BOOL,
    valueNotRequired: true,
}

function getCommandLabel(app: AnyApp, path: readonly string[]) {
    const proc = Chalk.cyan(getProcName(app))
    if (!path.length) {
        return proc
    }
    return `${proc} ${path.join(' ')}`
}

function formatUsageOption(opt: Option): string {
    const optionName = Chalk.green(getOptName(opt))
    if (opt.type === OptType.BOOL) {
        return optionName
    }

    const valuePlaceholder = Chalk.magenta(getValuePlaceholder(opt))
    if (opt.valueNotRequired) {
        return `${optionName}${Chalk.grey('[')}=${valuePlaceholder}${Chalk.grey(']')}`
    }
    return `${optionName}=${valuePlaceholder}`
}

function formatUsageArgument(arg: Argument): string {
    const argumentName = Chalk.magenta(arg.repeatable ? `${arg.name}...` : arg.name)
    return `${Chalk.grey(arg.required ? '<' : '[')}${argumentName}${Chalk.grey(arg.required ? '>' : ']')}`
}

export function printCommandHelp(app: AnyApp, cmd: AnyApp | AnyCmd, path: readonly string[] = []) {
    if (cmd.description) {
        printLn(cmd.description)
        printLn()
    }
    if (cmd === app) {
        const author = (app as InternalAppMetadata)._author
        if (author) {
            printLn(`Author: ${author}`)
            printLn()
        }
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
                    print(` ${formatUsageOption(opt)}`)
                } else {
                    ++otherOptions
                }
            }
            if (otherOptions) {
                print(` ${Chalk.gray('[')}${Chalk.magenta('--options')}${Chalk.gray(']')}`)
            }
        }
        if (cmd.positonals?.length) {
            print(` ${Chalk.grey('[')}--${Chalk.grey(']')}`)
            for (const arg of cmd.positonals) {
                print(` ${formatUsageArgument(arg)}`)
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
            printLn(Chalk.yellow('\nArguments:'))
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

    const globalOptions = [HELP_OPTION, ...(app.globalOptions ?? [])]
    if (globalOptions.length) {
        printLn()
        printLn(Chalk.yellow('Global Options:'))
        const lines = globalOptions.map(formatOption)
        const width = Math.max(...lines.map(line => stringWidth(line[0])))
        for (const line of lines) {
            printLn('  ' + line[0] + space(width + 2, line[0]) + line[1])
        }
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
