import {App} from './interfaces'
import {helpCommand} from './commands/command-help'
import {versionCommand} from './commands/version'
import {printHelp} from './app-help'
import {getCommand, parseArgs} from './options'
import {abort, sortBy} from './utils'
import {printCommandHelp} from './print-command-help'

export default function run(app: App) {
    app = {
        ...app,
        commands: [...sortBy(app.commands, c => c.name), versionCommand,helpCommand],
        // commands: sortBy([...app.commands,versionCommand,helpCommand], c => c.name),
    }
    if (process.argv.length <= 2) {
        printHelp(app)
        process.exit(0)
    }

    const cmd = getCommand(process.argv[2], app)
    const rawArgs = process.argv.slice(3)
    if (rawArgs.includes('--help')) {
        printCommandHelp(app, cmd)
        process.exit(0)
    }
    let args, opts
    try {
        [args, opts] = parseArgs(cmd, rawArgs)
    } catch (err) {
        abort(String(err.message))
        process.exit(2)
    }
    Promise.resolve(cmd.execute(opts, args, app))
        .then(code => {
            if (code != null) {
                process.exit(code)
            }
            process.exit(0)
        }, err => {
            // console.error(err)
            abort(String(err.stack))
            process.exit(1)
        })

}
