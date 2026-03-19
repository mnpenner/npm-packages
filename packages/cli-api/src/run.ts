import type {AnyApp, AnyCmd, AnyLeafCommand} from './interfaces'
import {getExecuteHandler, hasSubCommands, isExecutable} from './interfaces'
import {helpCommand} from './commands/command-help'
import {versionCommand} from './commands/version'
import {printHelp} from './app-help'
import {findSubCommand, parseArgs, resolveCommand} from './options'
import {printError, sortBy} from './utils'
import {printCommandHelp} from './print-command-help'

function getRootCommands(app: AnyApp): readonly AnyCmd[] {
    const userCommands = hasSubCommands(app)
        ? sortBy(app.subCommands as readonly AnyCmd[], c => c.name)
        : []

    return [
        ...userCommands,
        versionCommand as unknown as AnyCmd,
        helpCommand as unknown as AnyCmd,
    ] as const
}

async function executeLeaf(app: AnyApp, cmd: AnyLeafCommand, rawArgs: string[], path: readonly string[]): Promise<number> {
    if (rawArgs.includes('--help')) {
        printCommandHelp(app, cmd, path)
        return 0
    }

    let args: any[]
    let opts: Record<string, any>
    try {
        ;[args, opts] = parseArgs(cmd, rawArgs)
    } catch (err) {
        printError(err instanceof Error ? err.message : String(err))
        return 1
    }

    const handler = getExecuteHandler(cmd)
    if(handler === undefined) {
        printError('Command is not executable.')
        return 1
    }

    try {
        const code = await Promise.resolve(handler.call(app, opts as any, args as any))
        return code ?? 0
    } catch (err) {
        printError(String((err as any)?.stack ?? err))
        return 1
    }
}

export async function executeApp(app: AnyApp, argv: string[] = process.argv.slice(2)): Promise<number> {
    const rootCommands = getRootCommands(app)

    if (argv.length === 0) {
        if (isExecutable(app)) {
            return executeLeaf(app, app, [], [])
        }
        printHelp(app, rootCommands)
        return 0
    }

    if (argv[0] === '--help') {
        if (isExecutable(app)) {
            printCommandHelp(app, app, [])
        } else {
            printHelp(app, rootCommands)
        }
        return 0
    }

    if (isExecutable(app) && !hasSubCommands(app)) {
        const builtin = findSubCommand(argv[0], rootCommands)
        if (builtin && isExecutable(builtin)) {
            return executeLeaf(app, builtin, argv.slice(1), [builtin.name])
        }

        return executeLeaf(app, app, argv, [])
    }

    const resolved = resolveCommand(argv, rootCommands)
    if (!resolved.command) {
        printError(`Command "${argv[0]}" does not exist.`)
        return 1
    }

    if (hasSubCommands(resolved.command)) {
        if (!resolved.remainingArgv.length || resolved.remainingArgv[0] === '--help') {
            printCommandHelp(app, resolved.command, resolved.path)
            return 0
        }
        printError(`Command "${resolved.remainingArgv[0]}" does not exist.`)
        return 1
    }

    if (!isExecutable(resolved.command)) {
        printError('Command is not executable.')
        return 1
    }

    return executeLeaf(app, resolved.command, resolved.remainingArgv, resolved.path)
}
