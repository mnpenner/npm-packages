import {defineCommand, hasSubCommands} from '../interfaces'
import {versionCommand} from './version'
import {getCommand} from '../options'
import {printCommandHelp} from '../print-command-help'
import {printHelp} from '../app-help'
import {sortBy} from '../utils'

export const helpCommand = defineCommand({
    name: 'help',
    description: 'Displays help for a command',
    positonals: [
        {
            name: 'command',
            description: 'The command path.',
            required: false,
            repeatable: true,
        }
    ],
    async execute(options, commandPath) {
        const rootCommands = [
            ...(hasSubCommands(this) ? sortBy(this.subCommands, c => c.name) : []),
            versionCommand,
            helpCommand,
        ] as const

        if(commandPath.length) {
            const {command, path} = getCommand(commandPath as string[], rootCommands)
            printCommandHelp(this, command, path)
        } else if(hasSubCommands(this)) {
            printHelp(this, rootCommands)
        } else {
            printCommandHelp(this, this, [])
        }
    }
})
