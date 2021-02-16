import {App} from './interfaces'
import {getProcName, print, printLn, space} from './utils'
import Chalk from 'chalk'
import stringWidth from 'string-width'

export function printHelp(app: App) {
    print(Chalk.green(app.name))
    if (app.version) {
        print(` version ${Chalk.yellow(app.version)}`)
    }
    print('\n\n')
    printLn(Chalk.yellow("Usage:"))
    printLn(`  ${Chalk.cyan(getProcName(app))} command ${Chalk.gray(`[options] [arguments]`)}\n`)

    if (app.globalOptions) {
        printLn("TODO")
    }

    printLn(Chalk.yellow("Available commands:"))
    const width = Math.max(...app.commands.map(c => stringWidth(c.name))) + 2
    for (const cmd of app.commands) {
        print(`  ${Chalk.green(cmd.name)}`)
        if (cmd.description) {
            print(`${space(width, cmd.name)}${cmd.description}`)
        }
        printLn()
    }

    printLn()
}
