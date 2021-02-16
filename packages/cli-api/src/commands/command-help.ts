import {App, Command} from '../interfaces'
import {getCommand} from '../options'
import {printCommandHelp} from '../print-command-help'
import {printAvailableCommands} from '../app-help'
import {printLn} from '../utils'

export const helpCommand: Command = {
    name: 'help',
    // alias: '--help',
    description: "Displays help for a command",
    arguments: [
        {
            name: "command",
            description: "The command name.",
            required: false,
        }
    ],
    async execute(options: Record<string, string>, [commandName]: string[], app: App) {
        if(commandName) {
            printCommandHelp(app, getCommand(commandName, app))
        } else {
            printCommandHelp(app, getCommand('help', app))
            printLn()
            printAvailableCommands(app)
        }
    }
}

