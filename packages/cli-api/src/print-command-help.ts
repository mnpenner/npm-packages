import type {AnyApp, AnyCmd, ExecutionContext} from './interfaces'
import {OptType, hasSubCommands, isExecutable} from './interfaces'
import {printAvailableCommands} from './app-help'
import {getProcName, getTerminalWidth, print, printLn, space, toArray, wrapText} from './utils'
import {getGlobalOptions} from './global-options'
import {formatOption, getOptions, getOptName, getValuePlaceholder} from './options'
import stringWidth from 'string-width'
import type {ChalkInstance} from 'chalk'
import type {Argument, Option} from './interfaces'

function shouldWrapHelpEntry(label: string, description: string | undefined, labelWidth: number): boolean {
    if (!description) {
        return false
    }

    const terminalWidth = getTerminalWidth()
    const inlineIndent = labelWidth + 4
    const inlineDescriptionWidth = Math.max(terminalWidth - inlineIndent, 1)
    const inlineDescriptionLines = wrapText(description, inlineDescriptionWidth)
    return description.includes('\n')
        || inlineDescriptionLines.length > 1
        || labelWidth + 4 + stringWidth(description) > terminalWidth
}

function printHelpEntry(label: string, description: string | undefined, labelWidth: number, forceWrap = false): boolean {
    print(`  ${label}`)
    if (!description) {
        printLn()
        return false
    }

    const shouldWrap = forceWrap || shouldWrapHelpEntry(label, description, labelWidth)

    if (!shouldWrap) {
        printLn(`${space(labelWidth + 2, label)}${description}`)
        return false
    }

    printLn()
    const terminalWidth = getTerminalWidth()
    const descriptionIndent = ' '.repeat(10)
    const wrappedDescription = wrapText(description, Math.max(terminalWidth - descriptionIndent.length, 1))
    for (const line of wrappedDescription) {
        printLn(line.length ? `${descriptionIndent}${line}` : '')
    }
    return true
}

function printOptionEntries(entries: Array<[string, string]>) {
    const width = Math.max(...entries.map(line => stringWidth(line[0])))
    const forceWrap = entries.some(([label, description]) => shouldWrapHelpEntry(label, description, width))
    entries.forEach(([label, description], index) => {
        const wrapped = printHelpEntry(label, description, width, forceWrap)
        if (wrapped && index < entries.length - 1) {
            printLn()
        }
    })
}

function getCommandLabel(context: ExecutionContext, path: readonly string[]) {
    const proc = context.chalk.cyan(getProcName(context.app))
    if (!path.length) {
        return proc
    }
    return `${proc} ${path.join(' ')}`
}

function formatUsageOption(opt: Option, chalk: ChalkInstance): string {
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

function formatUsageArgument(arg: Argument, chalk: ChalkInstance): string {
    const argumentName = chalk.magenta(arg.repeatable ? `${arg.name}...` : arg.name)
    return `${chalk.grey(arg.required ? '<' : '[')}${argumentName}${chalk.grey(arg.required ? '>' : ']')}`
}

export function printCommandHelp(context: ExecutionContext, cmd: AnyApp | AnyCmd, path: readonly string[] = []) {
    const app = context.app
    const chalk = context.chalk
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
    print(`  ${getCommandLabel(context, path)}`)

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
            printOptionEntries(allOptions.map(option => formatOption(option, chalk)))
        }

        if (cmd.positonals?.length) {
            printLn(chalk.yellow('\nArguments:'))
            const width = Math.max(...cmd.positonals.map((arg: {name: string}) => stringWidth(arg.name)))
            for (const arg of cmd.positonals) {
                printHelpEntry(chalk.green(arg.name), arg.description, width)
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
        printOptionEntries(globalOptions.map(option => formatOption(option, chalk)))
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
