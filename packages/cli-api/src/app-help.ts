import type {AnyApp, AnyCmd, Option} from './interfaces'
import {hasSubCommands} from './interfaces'
import {getProcName, print, printLn, space} from './utils'
import type {ChalkInstance} from 'chalk'
import {createChalk, ensureAppChalk} from './color'
import {getGlobalOptions} from './global-options'
import stringWidth from 'string-width'
import {formatOption} from './options'

type InternalAppMetadata = AnyApp & {
    globalOptions?: Option[]
    _version?: string
    _author?: string
    _globalOptions?: Option[]
}

export function printHelp(app: AnyApp, commands: readonly AnyCmd[]) {
    const chalk = ensureAppChalk(app)
    print(chalk.green(app.name))
    const {_author: author, _version: version} = app as InternalAppMetadata
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
        print(` ${chalk.gray('[--global-options]')} ${chalk.gray('<')}command${chalk.gray('>')}`)
    }
    printLn('\n')

    if (commands.length) {
        printAvailableCommands(commands, 'Commands:', chalk)
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
}

export function printAvailableCommands(commands: readonly AnyCmd[], title: string = 'Commands:', chalk: ChalkInstance = createChalk()) {
    if (!commands.length) {
        return
    }

    printLn(chalk.yellow(title))
    const width = Math.max(...commands.map(c => stringWidth(c.name))) + 2
    for (const cmd of commands) {
        print(`  ${chalk.green(cmd.name)}`)
        if (cmd.description) {
            print(`${space(width, cmd.name)}${cmd.description}`)
        }
        printLn()
    }
}
