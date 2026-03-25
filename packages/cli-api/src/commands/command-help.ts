import type {AnyCmd} from '../interfaces'
import {Command, getSubCommands, hasSubCommands} from '../interfaces'
import {versionCommand} from './version'
import {getCommand} from '../options'
import {printCommandHelp} from '../print-command-help'
import {printHelp} from '../app-help'
import {sortBy} from '../utils'

export const helpCommand = new Command('help')
    .describe('Displays help for a command')
    .arg('command', {
        description: 'The command path.',
        repeatable: true,
    })
    .run(async ({command: commandPath = []}, context) => {
        const app = context.app
        const rootCommands = [
            ...((getSubCommands(app) !== undefined) ? sortBy(getSubCommands(app)!, c => c.name) : []),
            versionCommand as unknown as AnyCmd,
            helpCommand as unknown as AnyCmd,
        ] as const satisfies readonly AnyCmd[]

        if(commandPath.length) {
            const {command, path} = getCommand(commandPath, rootCommands)
            printCommandHelp(context, command, path)
        } else if(getSubCommands(app) !== undefined) {
            printHelp(context, rootCommands)
        } else {
            printCommandHelp(context, app, [])
        }
    })
