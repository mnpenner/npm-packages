import {defineCommand} from '../interfaces'
import {printLn} from '../utils'

export const versionCommand = defineCommand({
    name: 'version',
    description: 'Displays current version',
    async execute() {
        printLn(this.version)
    }
})
