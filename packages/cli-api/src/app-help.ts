import type {AnyApp, AnyCmd} from './interfaces'
import {getAppVersion, hasSubCommands, isExecutable} from './interfaces'
import {getProcName, print, printLn, space} from './utils'
import Chalk from 'chalk'
import stringWidth from 'string-width'

export function printHelp(app: AnyApp, commands: readonly AnyCmd[]) {
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

    if (app.globalOptions) {
        printLn('TODO')
    }

    if (commands.length) {
        printAvailableCommands(commands)
    }
}

export function printAvailableCommands(commands: readonly AnyCmd[], title: string = 'Available commands:') {
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
