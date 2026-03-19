import type {AnyApp} from '../interfaces'
import {Command, getAppVersion} from '../interfaces'
import {printLn} from '../utils'

export const versionCommand = new Command('version')
    .describe('Displays current version')
    .run(async function(this: AnyApp) {
        printLn(getAppVersion(this))
    })
