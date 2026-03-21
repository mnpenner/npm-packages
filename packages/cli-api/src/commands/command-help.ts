import type {AnyApp, AnyCmd} from '../interfaces'
import {Command, hasSubCommands} from '../interfaces'
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
    .run(async function(commandPath: string[]) {
        const app = this as AnyApp
        const rootCommands = [
            ...((app.subCommands !== undefined) ? sortBy(app.subCommands, c => c.name) : []),
            versionCommand as unknown as AnyCmd,
            helpCommand as unknown as AnyCmd,
        ] as const satisfies readonly AnyCmd[]

        if(commandPath.length) {
            const {command, path} = getCommand(commandPath as string[], rootCommands)
            printCommandHelp(app, command, path)
        } else if(app.subCommands !== undefined) {
            printHelp(app, rootCommands)
        } else {
            printCommandHelp(app, app, [])
        }
    })
