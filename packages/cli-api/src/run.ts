import type {AnyApp, AnyCmd, AnyLeafCommand} from './interfaces'
import {getExecuteHandler, hasSubCommands, isExecutable} from './interfaces'
import {helpCommand} from './commands/command-help'
import {versionCommand} from './commands/version'
import {printHelp} from './app-help'
import {findSubCommand, parseArgs, resolveCommand, UnknownOptionError, validateCommandConfig} from './options'
import {getProcName, printError, sortBy} from './utils'
import {printCommandHelp} from './print-command-help'
import {printLn} from './utils'

type InternalAppMetadata = AnyApp & {_version?: string}
type ErrorStyle = 'default' | 'config'

/**
 * Result of executing or validating a CLI invocation.
 */
export interface ExecutionResult {
    code: number
    error?: string
    errorStyle?: ErrorStyle
    setProcessExitCode?: true
}

function isHelpFlag(arg: string | undefined): boolean {
    return arg === '--help' || arg === '-h'
}

function isVersionFlag(arg: string | undefined): boolean {
    return arg === '--version'
}

function stripHelpFlags(argv: readonly string[]): string[] {
    return argv.filter(arg => !isHelpFlag(arg))
}

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

function unknownCommandResult(app: AnyApp, commandName: string): ExecutionResult {
    return {
        code: 2,
        error: `${getProcName(app)}: unknown command '${commandName}'`,
        setProcessExitCode: true,
    }
}

async function executeLeaf(app: AnyApp, cmd: AnyLeafCommand, rawArgs: string[], path: readonly string[]): Promise<ExecutionResult> {
    try {
        validateCommandConfig(cmd)
    } catch (err) {
        return {
            code: 1,
            error: err instanceof Error ? err.message : String(err),
            errorStyle: 'config',
            setProcessExitCode: true,
        }
    }

    if (rawArgs.some(isHelpFlag)) {
        printCommandHelp(app, cmd, path)
        return {code: 0}
    }

    let args: any[]
    let opts: Record<string, any>
    try {
        ;[args, opts] = parseArgs(cmd, rawArgs)
    } catch (err) {
        if(err instanceof UnknownOptionError) {
            return {code: 2, error: `${getProcName(app)}: ${err.message}`, setProcessExitCode: true}
        }
        return {code: 1, error: err instanceof Error ? err.message : String(err), setProcessExitCode: true}
    }

    const handler = getExecuteHandler(cmd)
    if(handler === undefined) {
        return {code: 1, error: 'Command is not executable.', setProcessExitCode: true}
    }

    try {
        const code = await Promise.resolve(handler.call(app, opts as any, args as any))
        if(code === undefined) {
            return {code: 0}
        }
        return {code, setProcessExitCode: true}
    } catch (err) {
        return {code: 1, error: String((err as any)?.stack ?? err), setProcessExitCode: true}
    }
}

/**
 * Parses CLI arguments and returns the resulting exit code and optional error message.
 *
 * @param app The app to execute.
 * @param argv The raw CLI arguments to parse. Defaults to `process.argv.slice(2)`.
 * @returns The execution result, including any user-facing error text that should be printed.
 */
export async function executeAppResult(app: AnyApp, argv: string[] = process.argv.slice(2)): Promise<ExecutionResult> {
    const rootCommands = getRootCommands(app)

    if (argv.length === 0) {
        if (isExecutable(app)) {
            return executeLeaf(app, app, [], [])
        }
        printHelp(app, rootCommands)
        return {code: 0}
    }

    if (argv.some(isHelpFlag)) {
        if (hasSubCommands(app)) {
            const filteredArgv = stripHelpFlags(argv)
            if (!filteredArgv.length) {
                printHelp(app, rootCommands)
                return {code: 0}
            }

            const resolved = resolveCommand(filteredArgv, rootCommands)
            if (!resolved.command) {
                printHelp(app, rootCommands)
                return {code: 0}
            }

            if (isExecutable(resolved.command)) {
                try {
                    validateCommandConfig(resolved.command)
                } catch (err) {
                    return {
                        code: 1,
                        error: err instanceof Error ? err.message : String(err),
                        errorStyle: 'config',
                        setProcessExitCode: true,
                    }
                }
            }

            printCommandHelp(app, resolved.command, resolved.path)
            return {code: 0}
        }

        if (isExecutable(app)) {
            return executeLeaf(app, app, argv, [])
        }

        printHelp(app, rootCommands)
        return {code: 0}
    }

    if (isVersionFlag(argv[0])) {
        printLn((app as InternalAppMetadata)._version)
        return {code: 0}
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
        return unknownCommandResult(app, argv[0])
    }

    if (hasSubCommands(resolved.command)) {
        if (!resolved.remainingArgv.length || isHelpFlag(resolved.remainingArgv[0])) {
            printCommandHelp(app, resolved.command, resolved.path)
            return {code: 0}
        }
        return unknownCommandResult(app, resolved.remainingArgv[0])
    }

    if (!isExecutable(resolved.command)) {
        return {code: 1, error: 'Command is not executable.', setProcessExitCode: true}
    }

    return executeLeaf(app, resolved.command, resolved.remainingArgv, resolved.path)
}

/**
 * Parses CLI arguments, prints any resulting error, and executes the matching command.
 *
 * @param app The app to execute.
 * @param argv The raw CLI arguments to parse. Defaults to `process.argv.slice(2)`.
 * @returns The process exit code for the CLI invocation.
 */
export async function executeApp(app: AnyApp, argv: string[] = process.argv.slice(2)): Promise<number> {
    const result = await executeAppResult(app, argv)
    if(result.error !== undefined) {
        printError(result.error, result.errorStyle)
    }
    return result.code
}
