import type {AnyApp, AnyCmd, AnyLeafCommand} from './interfaces'
import {hasSubCommands, isExecutable} from './interfaces'
import {helpCommand} from './commands/command-help'
import {versionCommand} from './commands/version'
import {printHelp} from './app-help'
import {findSubCommand, parseArgs, resolveCommand} from './options'
import {abort, sortBy} from './utils'
import {printCommandHelp} from './print-command-help'

function getRootCommands(app: AnyApp): readonly AnyCmd[] {
    const userCommands = hasSubCommands(app)
        ? sortBy(app.subCommands as readonly AnyCmd[], c => c.name)
        : []

    return [
        ...userCommands,
        versionCommand as AnyCmd,
        helpCommand as AnyCmd,
    ] as const
}

function executeLeaf(app: AnyApp, cmd: AnyLeafCommand, rawArgs: string[], path: readonly string[]) {
    if (rawArgs.includes('--help')) {
        printCommandHelp(app, cmd, path)
        process.exit(0)
    }

    let args: any[]
    let opts: Record<string, any>
    try {
        ;[args, opts] = parseArgs(cmd, rawArgs)
    } catch (err) {
        abort(err instanceof Error ? err.message : String(err))
    }

    Promise.resolve(cmd.execute.call(app, opts as any, args as any))
        .then(code => process.exit(code ?? 0))
        .catch(err => {
            abort(String((err as any)?.stack ?? err))
            process.exit(1)
        })
}

export default function run(app: AnyApp) {
    const rootCommands = getRootCommands(app)
    const argv = process.argv.slice(2)

    if (argv.length === 0) {
        if (isExecutable(app)) {
            executeLeaf(app, app, [], [])
            return
        }
        printHelp(app, rootCommands)
        process.exit(0)
    }

    if (argv[0] === '--help') {
        if (isExecutable(app)) {
            printCommandHelp(app, app, [])
        } else {
            printHelp(app, rootCommands)
        }
        process.exit(0)
    }

    if (isExecutable(app) && !hasSubCommands(app)) {
        const builtin = findSubCommand(argv[0], rootCommands)
        if (builtin && isExecutable(builtin)) {
            executeLeaf(app, builtin, argv.slice(1), [builtin.name])
            return
        }

        executeLeaf(app, app, argv, [])
        return
    }

    const resolved = resolveCommand(argv, rootCommands)
    if (!resolved.command) {
        abort(`Command "${argv[0]}" does not exist.`)
    }

    if (hasSubCommands(resolved.command)) {
        if (!resolved.remainingArgv.length || resolved.remainingArgv[0] === '--help') {
            printCommandHelp(app, resolved.command, resolved.path)
            process.exit(0)
        }
        abort(`Command "${resolved.remainingArgv[0]}" does not exist.`)
    }

    if (!isExecutable(resolved.command)) {
        abort('Command is not executable.')
    }

    executeLeaf(app, resolved.command, resolved.remainingArgv, resolved.path)
}
