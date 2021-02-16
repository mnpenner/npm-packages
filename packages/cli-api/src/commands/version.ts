import {Command} from '../interfaces'
import {printLn} from '../utils'

export const versionCommand: Command = {
    name: 'version',
    // alias: '--version',
    description: "Displays current version",
    async execute(opts, args, app) {
        printLn(app.version)
    }
}
