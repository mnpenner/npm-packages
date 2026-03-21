import type {App, AnyCmd} from './interfaces'
import {OptType, hasSubCommands, isExecutable} from './interfaces'
import {printAvailableCommands} from './app-help'
import {getProcName, print, printLn, space, toArray} from './utils'
import {getGlobalOptions} from './global-options'
import {formatOption, getOptions, getOptName, getValuePlaceholder} from './options'
import stringWidth from 'string-width'
import type {Argument, Option} from './interfaces'

type AppInstance = App<any, any, any, any, any>

const HELP_OPTION: Option = {
    name: 'help',
    alias: 'h',
    description: 'Show help text',
    type: OptType.BOOL,
    valueNotRequired: true,
}

function getCommandLabel(app: AppInstance, path: readonly string[]) {
    const proc = app.chalk.cyan(getProcName(app))
    if (!path.length) {
        return proc
    }
    return `${proc} ${path.join(' ')}`
}

function formatUsageOption(opt: Option, chalk: AppInstance['chalk']): string {
    const optionName = chalk.green(getOptName(opt))
    if (opt.type === OptType.BOOL) {
        return optionName
    }

    const valuePlaceholder = chalk.magenta(getValuePlaceholder(opt))
    if (opt.valueNotRequired) {
        return `${optionName}${chalk.grey('[')}=${valuePlaceholder}${chalk.grey(']')}`
    }
    return `${optionName}=${valuePlaceholder}`
}

function formatUsageArgument(arg: Argument, chalk: AppInstance['chalk']): string {
    const argumentName = chalk.magenta(arg.repeatable ? `${arg.name}...` : arg.name)
    return `${chalk.grey(arg.required ? '<' : '[')}${argumentName}${chalk.grey(arg.required ? '>' : ']')}`
}

export function printCommandHelp(app: AppInstance, cmd: AppInstance | AnyCmd, path: readonly string[] = []) {
    const chalk = app.chalk
    if (cmd.description) {
        printLn(cmd.description)
        printLn()
    }
    if (cmd === app) {
        const author = app._author
        if (author) {
            printLn(`Author: ${author}`)
            printLn()
        }
    }

    printLn(chalk.yellow('Usage:'))
    print(`  ${getCommandLabel(app, path)}`)

    if (hasSubCommands(cmd)) {
        print(` ${chalk.gray('<')}command${chalk.gray('>')}`)
    }

    if (isExecutable(cmd)) {
        const allOptions = getOptions(cmd)
        if (allOptions.length) {
            let otherOptions = 0
            for (const opt of allOptions) {
                if (opt.required) {
                    print(` ${formatUsageOption(opt, chalk)}`)
                } else {
                    ++otherOptions
                }
            }
            if (otherOptions) {
                print(` ${chalk.gray('[')}${chalk.magenta('--options')}${chalk.gray(']')}`)
            }
        }
        if (cmd.positonals?.length) {
            print(` ${chalk.grey('[')}--${chalk.grey(']')}`)
            for (const arg of cmd.positonals) {
                print(` ${formatUsageArgument(arg, chalk)}`)
            }
        }
    } else if (!hasSubCommands(cmd)) {
        print(` ${chalk.gray('[options] [positionals]')}`)
    }
    printLn()

    if (isExecutable(cmd)) {
        const allOptions = getOptions(cmd)
        if (allOptions.length) {
            printLn(chalk.yellow('\nOptions:'))
            const lines = allOptions.map(option => formatOption(option, chalk))
            const width = Math.max(...lines.map(l => stringWidth(l[0])))
            for (const line of lines) {
                printLn('  ' + line[0] + space(width + 2, line[0]) + line[1])
            }
        }

        if (cmd.positonals?.length) {
            printLn(chalk.yellow('\nArguments:'))
            const width = Math.max(...cmd.positonals.map((arg: {name: string}) => stringWidth(arg.name)))
            for (const arg of cmd.positonals) {
                print('  ' + chalk.green(arg.name))
                if (arg.description) {
                    print(space(width + 2, arg.name) + arg.description)
                }
                printLn()
            }
        }
    }

    if (hasSubCommands(cmd)) {
        printLn()
        printAvailableCommands(cmd.subCommands, 'Sub-commands:', chalk)
    }

    const globalOptions = getGlobalOptions(app)
    if (globalOptions.length) {
        printLn()
        printLn(chalk.yellow('Global Options:'))
        const lines = globalOptions.map(option => formatOption(option, chalk))
        const width = Math.max(...lines.map(line => stringWidth(line[0])))
        for (const line of lines) {
            printLn('  ' + line[0] + space(width + 2, line[0]) + line[1])
        }
    }

    if (cmd.alias) {
        const aliases = toArray(cmd.alias)
        printLn(chalk.yellow(`\nAlias${aliases.length !== 1 ? 'es' : ''}: `) + aliases.join(chalk.gray(', ')))
    }
    if (cmd.longDescription) {
        printLn(chalk.yellow('\nDescription:'))
        printLn('  ' + cmd.longDescription)
    }
}
