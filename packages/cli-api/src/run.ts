import type {AnyApp, AnyCmd, AnyLeafCommand} from './interfaces'
import {getExecuteHandler, hasSubCommands, isExecutable} from './interfaces'
import {helpCommand} from './commands/command-help'
import {versionCommand} from './commands/version'
import {printHelp} from './app-help'
import {findSubCommand, parseArgs, resolveCommand, UnknownOptionError, validateCommandConfig} from './options'
import type {CliError} from './utils'
import {createError, ErrorStyle, getErrorExitCode, getProcName, printError, sortBy} from './utils'
import {printCommandHelp} from './print-command-help'
import {printLn} from './utils'
import {isColorMode, setAppColorMode, syncAppChalk} from './color'

type InternalAppMetadata = AnyApp & {_version?: string}

function formatConfigError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error)
    return `Config Error: ${message}`
}

/**
 * Result of executing or validating a CLI invocation.
 */
export interface ExecutionResult {
    code: number | null
    error?: CliError
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

function getHelpValidationArgs(argv: readonly string[]): string[] {
    return stripHelpFlags(argv)
}

function getHelpValidationCommand(cmd: AnyLeafCommand): AnyLeafCommand {
    return {
        ...cmd,
        options: cmd.options?.map(opt => ({...opt, required: false})),
        positonals: cmd.positonals?.map(arg => ({...arg, required: false})),
    }
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

function preprocessGlobalColor(app: AnyApp, argv: readonly string[]): string[] {
    const nextArgv: string[] = []
    let parseFlags = true
    let colorMode: import('./color').ColorMode = 'auto'

    for(let i = 0; i < argv.length; ++i) {
        const token = argv[i]

        if(parseFlags && token === '--') {
            parseFlags = false
            nextArgv.push(token)
            continue
        }

        if(parseFlags && token === '--no-color') {
            colorMode = 'never'
            continue
        }

        if(parseFlags && token === '--color') {
            colorMode = 'always'
            continue
        }

        if(parseFlags && token.startsWith('--color=')) {
            const value = token.slice('--color='.length).trim().toLowerCase()
            if(!isColorMode(value)) {
                throw new Error(`Invalid value for option \`--color\`: ${value}`)
            }
            colorMode = value
            continue
        }

        nextArgv.push(token)
    }

    setAppColorMode(app, colorMode)
    return nextArgv
}

function unknownCommandResult(app: AnyApp, commandName: string): ExecutionResult {
    const error = createError(`${getProcName(app)}: unknown command '${commandName}'`, ErrorStyle.InvalidArg)
    return {
        code: getErrorExitCode(error),
        error,
    }
}

async function executeLeaf(app: AnyApp, cmd: AnyLeafCommand, rawArgs: string[], path: readonly string[]): Promise<ExecutionResult> {
    try {
        validateCommandConfig(cmd)
    } catch (err) {
        const error = createError(formatConfigError(err), ErrorStyle.Misconfig)
        return {
            code: getErrorExitCode(error),
            error,
        }
    }

    let args: any[]
    let opts: Record<string, any>
    try {
        if (rawArgs.some(isHelpFlag)) {
            parseArgs(getHelpValidationCommand(cmd), getHelpValidationArgs(rawArgs))
            if (cmd === app && !hasSubCommands(app)) {
                printHelp(app, getRootCommands(app))
                return {code: 0}
            }
            printCommandHelp(app, cmd, path)
            return {code: 0}
        }

        ;[args, opts] = parseArgs(cmd, rawArgs)
    } catch (err) {
        if(err instanceof UnknownOptionError) {
            const error = createError(`${getProcName(app)}: ${err.message}`, ErrorStyle.InvalidArg)
            return {
                code: getErrorExitCode(error),
                error,
            }
        }
        const error = createError(err instanceof Error ? err.message : String(err), ErrorStyle.InvalidArg)
        return {
            code: getErrorExitCode(error),
            error,
        }
    }

    const handler = getExecuteHandler(cmd)
    if(handler === undefined) {
        const error = createError('Command is not executable.', ErrorStyle.Internal)
        return {
            code: getErrorExitCode(error),
            error,
        }
    }

    try {
        const code = await Promise.resolve(handler.call(app, opts as any, args as any))
        if(code === undefined) {
            return {code: null}
        }
        return {code}
    } catch (err) {
        const error = createError(String((err as any)?.stack ?? err), ErrorStyle.Internal)
        return {
            code: getErrorExitCode(error),
            error,
        }
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
    let normalizedArgv: string[]
    try {
        normalizedArgv = preprocessGlobalColor(app, argv)
    } catch(err) {
        syncAppChalk(app)
        const error = createError(err instanceof Error ? err.message : String(err), ErrorStyle.InvalidArg)
        return {
            code: getErrorExitCode(error),
            error,
        }
    }
    syncAppChalk(app)
    const rootCommands = getRootCommands(app)

    if (normalizedArgv.length === 0) {
        if (isExecutable(app)) {
            return executeLeaf(app, app, [], [])
        }
        printHelp(app, rootCommands)
        return {code: 0}
    }

    if (normalizedArgv.some(isHelpFlag)) {
        if (hasSubCommands(app)) {
            const filteredArgv = stripHelpFlags(normalizedArgv)
            if (!filteredArgv.length) {
                printHelp(app, rootCommands)
                return {code: 0}
            }

            const resolved = resolveCommand(filteredArgv, rootCommands)
            if (!resolved.command) {
                return unknownCommandResult(app, filteredArgv[0])
            }

            if (hasSubCommands(resolved.command)) {
                if (resolved.remainingArgv.length) {
                    return unknownCommandResult(app, resolved.remainingArgv[0])
                }

                printCommandHelp(app, resolved.command, resolved.path)
                return {code: 0}
            }

            return executeLeaf(
                app,
                resolved.command,
                [...resolved.remainingArgv, ...normalizedArgv.filter(isHelpFlag)],
                resolved.path,
            )
        }

        if (isExecutable(app)) {
            return executeLeaf(app, app, normalizedArgv, [])
        }

        printHelp(app, rootCommands)
        return {code: 0}
    }

    if (isVersionFlag(normalizedArgv[0])) {
        printLn((app as InternalAppMetadata)._version)
        return {code: 0}
    }

    if (isExecutable(app) && !hasSubCommands(app)) {
        const builtin = findSubCommand(normalizedArgv[0], rootCommands)
        if (builtin && isExecutable(builtin)) {
            return executeLeaf(app, builtin, normalizedArgv.slice(1), [builtin.name])
        }

        return executeLeaf(app, app, normalizedArgv, [])
    }

    const resolved = resolveCommand(normalizedArgv, rootCommands)
    if (!resolved.command) {
        return unknownCommandResult(app, normalizedArgv[0])
    }

    if (hasSubCommands(resolved.command)) {
        if (!resolved.remainingArgv.length || isHelpFlag(resolved.remainingArgv[0])) {
            printCommandHelp(app, resolved.command, resolved.path)
            return {code: 0}
        }
        return unknownCommandResult(app, resolved.remainingArgv[0])
    }

    if (!isExecutable(resolved.command)) {
        const error = createError('Command is not executable.', ErrorStyle.Internal)
        return {
            code: getErrorExitCode(error),
            error,
        }
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
        printError(result.error)
    }
    return result.code ?? 0
}
