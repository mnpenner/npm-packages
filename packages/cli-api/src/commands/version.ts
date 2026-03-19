import {Command} from '../interfaces'
import {printLn} from '../utils'

export const versionCommand = new Command('version')
    .describe('Displays current version')
    .run(async function() {
        printLn(this._version)
    })
