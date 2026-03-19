import type {AnyApp, AnyCmd} from './interfaces'
import {getAppVersion, hasSubCommands, isExecutable} from './interfaces'
import {getProcName, print, printLn, space} from './utils'
import Chalk from 'chalk'
import stringWidth from 'string-width'
import {formatOption} from './options'
import type {Option} from './interfaces'

const HELP_OPTION: Option = {
    name: 'help',
    alias: 'h',
    description: 'Show help text',
    valueNotRequired: true,
}

export function printHelp(app: AnyApp, commands: readonly AnyCmd[]) {
    if (app.description) {
        printLn(app.description)
        printLn()
    }

    print(Chalk.green(app.name))
    const version = getAppVersion(app)
    if (version) {
        print(` version ${Chalk.yellow(version)}`)
    }
    print('\n\n')
    printLn(Chalk.yellow('Usage:'))
    print(`  ${Chalk.cyan(getProcName(app))}`)
    if (hasSubCommands(app)) {
        print(` ${Chalk.gray('<')}command${Chalk.gray('>')}`)
    }
    if (isExecutable(app)) {
        print(` ${Chalk.gray('[options] [positionals]')}`)
    } else if (hasSubCommands(app)) {
        print(` ${Chalk.gray('[options] [positionals]')}`)
    }
    printLn('\n')

    if (commands.length) {
        printAvailableCommands(commands)
    }

    const globalOptions = [HELP_OPTION, ...(app.globalOptions ?? [])]
    if (globalOptions.length) {
        printLn()
        printLn(Chalk.yellow('Global options:'))
        const lines = globalOptions.map(formatOption)
        const width = Math.max(...lines.map(line => stringWidth(line[0])))
        for (const line of lines) {
            printLn('  ' + line[0] + space(width + 2, line[0]) + line[1])
        }
    }
}

export function printAvailableCommands(commands: readonly AnyCmd[], title: string = 'Commands:') {
    if (!commands.length) {
        return
    }

    printLn(Chalk.yellow(title))
    const width = Math.max(...commands.map(c => stringWidth(c.name))) + 2
    for (const cmd of commands) {
        print(`  ${Chalk.green(cmd.name)}`)
        if (cmd.description) {
            print(`${space(width, cmd.name)}${cmd.description}`)
        }
        printLn()
    }
}
