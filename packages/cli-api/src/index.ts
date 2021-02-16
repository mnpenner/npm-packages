import type {App, Command, Option} from "./interfaces"
import {OptType} from './interfaces'
import {abort} from './utils'
import {parseArgs} from './options'
import {getCommand, helpCommand} from './commands/help'
import {printHelp} from './app-help'

export {OptType};
export type {Command,App,Option}

export default function run(app: App) {
    app = {
        ...app,
        commands: [...app.commands, helpCommand],
    }
    if (process.argv.length <= 2) {
        printHelp(app)
    } else {
        const cmd = getCommand(process.argv[2], app)
        let args,opts;
        try {
            [args, opts] = parseArgs(cmd, process.argv.slice(3))
        } catch(err) {
            abort(String(err.message))
        }
        Promise.resolve(cmd.execute(opts, args, app)).then(code => {
            if(code != null) {
                process.exit(code)
            }
        }, err => {
            // console.error(err)
            abort(String(err.stack))
        })
    }
}
