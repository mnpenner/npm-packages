import type {AnyCmd, ExecutionContext} from './interfaces'
import {hasSubCommands} from './interfaces'
import {getProcName, getTerminalWidth, print, printLn, space, wrapText} from './utils'
import type {ChalkInstance} from 'chalk'
import {getGlobalOptions} from './global-options'
import stringWidth from 'string-width'
import {formatOption} from './options'

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

export function printHelp(context: ExecutionContext, commands: readonly AnyCmd[]) {
    const app = context.app
    const chalk = context.chalk
    print(chalk.green(app.name))
    const {_author: author, _version: version} = app
    if (version) {
        print(` ver. ${chalk.yellow(version)}`)
    }
    if (author) {
        print(` by ${chalk.cyan(author)}`)
    }
    printLn()

    if (app.description) {
        printLn()
        printLn(app.description)
    }

    printLn()
    printLn(chalk.yellow('Usage:'))
    print(`  ${chalk.cyan(getProcName(app))}`)
    if (hasSubCommands(app)) {
        print(` ${chalk.gray('[')}--GLOBAL-OPTIONS${chalk.gray(']')} ${chalk.gray('<')}COMMAND${chalk.gray('>')}`)
    }
    printLn('\n')

    if (commands.length) {
        printAvailableCommands(commands, 'Commands:', chalk)
    }

    const globalOptions = getGlobalOptions(app)
    if (globalOptions.length) {
        printLn()
        printLn(chalk.yellow('Global Options:'))
        printOptionEntries(globalOptions.map(option => formatOption(option, chalk)))
    }
}

export function printAvailableCommands(commands: readonly AnyCmd[], title: string, chalk: ChalkInstance) {
    if (!commands.length) {
        return
    }

    printLn(chalk.yellow(title))
    const width = Math.max(...commands.map(c => stringWidth(c.name))) + 2
    for (const cmd of commands) {
        printHelpEntry(chalk.green(cmd.name), cmd.description, width)
    }
}
