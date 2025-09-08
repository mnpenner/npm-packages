import {Command, defineCommand} from '../interfaces'
import {printLn} from '../utils'

export const versionCommand = defineCommand({
    name: 'version',
    // alias: '--version',
    description: "Displays current version",
    async execute(opts, args, app) {
        printLn(app.version)
    }
})
