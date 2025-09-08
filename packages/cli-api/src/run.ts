import type {AnyApp, AnyCmd, App} from "./interfaces"
import {helpCommand} from "./commands/command-help"
import {versionCommand} from "./commands/version"
import {printHelp} from "./app-help"
import {getCommand, parseArgs} from "./options"
import {abort, sortBy} from "./utils"
import {printCommandHelp} from "./print-command-help"

export default function run<Cs extends readonly AnyCmd[]>(app: App<Cs>) {
    // widen to an app whose commands are generic commands
    const fullApp: AnyApp = {
        ...app,
        commands: [
            ...sortBy(app.commands as readonly AnyCmd[], c => c.name),
            versionCommand as AnyCmd,
            helpCommand as AnyCmd,
        ] as const,
    }

    if (process.argv.length <= 2) {
        printHelp(fullApp)
        process.exit(0)
    }

    const cmd = getCommand(process.argv[2], fullApp) // returns a Command<any,any>
    const rawArgs = process.argv.slice(3)

    if (rawArgs.includes("--help")) {
        printCommandHelp(fullApp, cmd)
        process.exit(0)
    }

    let args: any[], opts: Record<string, any>
    try {
        [args, opts] = parseArgs(cmd, rawArgs)
    } catch (err) {
        abort(err instanceof Error ? err.message : String(err))
    }

    Promise.resolve(cmd.execute(opts as any, args as any, fullApp))
        .then(code => process.exit(code ?? 0))
        .catch(err => {
            abort(String((err as any)?.stack ?? err))
            process.exit(1)
        })
}
