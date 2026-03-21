import type {AnyApp, AnyCmd, Option} from './interfaces'
import {hasSubCommands, OptType} from './interfaces'
import {getProcName, print, printLn, space} from './utils'
import Chalk from 'chalk'
import stringWidth from 'string-width'
import {formatOption} from './options'

type InternalAppMetadata = AnyApp & {
    globalOptions?: Option[]
    _version?: string
    _author?: string
    _globalOptions?: Option[]
}

const HELP_OPTION: Option = {
    name: 'help',
    alias: 'h',
    description: 'Show help text',
    type: OptType.BOOL,
    valueNotRequired: true,
}

export function printHelp(app: AnyApp, commands: readonly AnyCmd[]) {
    print(Chalk.green(app.name))
    const {_author: author, _version: version} = app as InternalAppMetadata
    if (version) {
        print(` ver. ${Chalk.yellow(version)}`)
    }
    if (author) {
        print(` by ${Chalk.cyan(author)}`)
    }
    printLn()

    if (app.description) {
        printLn()
        printLn(app.description)
    }

    printLn()
    printLn(Chalk.yellow('Usage:'))
    print(`  ${Chalk.cyan(getProcName(app))}`)
    if (hasSubCommands(app)) {
        print(` ${Chalk.gray('[--global-options]')} ${Chalk.gray('<')}command${Chalk.gray('>')}`)
    }
    printLn('\n')

    if (commands.length) {
        printAvailableCommands(commands)
    }

    const globalOptions = [HELP_OPTION, ...((app as InternalAppMetadata)._globalOptions ?? (app as InternalAppMetadata).globalOptions ?? [])]
    if (globalOptions.length) {
        printLn()
        printLn(Chalk.yellow('Global Options:'))
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
