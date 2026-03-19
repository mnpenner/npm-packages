import type {AnyApp} from '../interfaces'
import {Command} from '../interfaces'
import {printLn} from '../utils'

export const versionCommand = new Command('version')
    .describe('Displays current version')
    .run(async function(this: AnyApp) {
        printLn((this as AnyApp & {_version?: string})._version)
    })
