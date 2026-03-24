import {Command} from '../interfaces'
import {printLn} from '../utils'

export const versionCommand = new Command('version')
    .describe('Displays current version')
    .run(async (_, __, context) => {
        printLn(context.app._version)
    })
