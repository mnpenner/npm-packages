import type {AnyApp, AnyCmd, AnyLeafCommand} from './interfaces'
import {getExecuteHandler, hasSubCommands, isExecutable} from './interfaces'
import {helpCommand} from './commands/command-help'
import {versionCommand} from './commands/version'
import {printHelp} from './app-help'
import type {ResolvedCommand} from './options'
import {findSubCommand, parseArgs, UnknownOptionError, validateCommandConfig} from './options'
import type {CliError} from './utils'
import {createError, ErrorStyle, getErrorExitCode, getProcName, printError, sortBy} from './utils'
import {printCommandHelp} from './print-command-help'
import {printLn} from './utils'
import {createChalk} from './color'
import {getGlobalOptions} from './global-options'

function normalizeAppAsLeafCommand(app: AnyApp): AnyLeafCommand {
    const handler = app.handler
    if(handler === undefined) {
        throw new Error('Command is not executable.')
    }
    return {
        name: app.name,
        ...(app.alias !== undefined ? {alias: app.alias} : {}),
        ...(app.description !== undefined ? {description: app.description} : {}),
        ...(app.longDescription !== undefined ? {longDescription: app.longDescription} : {}),
        ...(app.options !== undefined ? {options: [...app.options]} : {}),
        ...(app.positonals !== undefined ? {positonals: [...app.positonals]} : {}),
        execute: handler,
    }
}

function normalizeLeafCommand(cmd: AnyLeafCommand): AnyLeafCommand {
    const handler = getExecuteHandler(cmd)
    if(handler === undefined) {
        throw new Error('Command is not executable.')
    }
    return {
        name: cmd.name,
        ...(cmd.alias !== undefined ? {alias: cmd.alias} : {}),
        ...(cmd.description !== undefined ? {description: cmd.description} : {}),
        ...(cmd.longDescription !== undefined ? {longDescription: cmd.longDescription} : {}),
        ...(cmd.options !== undefined ? {options: [...cmd.options]} : {}),
        ...(cmd.positonals !== undefined ? {positonals: [...cmd.positonals]} : {}),
        execute: handler,
    }
}

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

function mergeCommandOptions(app: AnyApp, cmd: AnyLeafCommand): AnyLeafCommand {
    const normalized = normalizeLeafCommand(cmd)
    return {
        ...normalized,
        options: [...getGlobalOptions(app), ...(normalized.options ?? [])],
    }
}

function isVersionFlag(arg: string | undefined): boolean {
    return arg === '--version'
}

function getHelpValidationCommand(cmd: AnyLeafCommand): AnyLeafCommand {
    return {
        ...cmd,
        options: cmd.options?.map(opt => ({...opt, required: false})),
        positonals: cmd.positonals?.map(arg => ({...arg, required: false})),
    }
}

function getRootCommands(app: AnyApp): readonly AnyCmd[] {
    const userCommands = app.subCommands !== undefined
        ? sortBy(app.subCommands as readonly AnyCmd[], c => c.name)
        : []

    return [
        ...userCommands,
        versionCommand as unknown as AnyCmd,
        helpCommand as unknown as AnyCmd,
    ] as const
}

function applyParsedGlobalState(app: AnyApp, opts: Record<string, any>): void {
    app._chalk = createChalk(opts.color ?? 'auto')
}

function createGlobalParseCommand(app: AnyApp): AnyLeafCommand {
    return {
        name: app.name,
        options: getGlobalOptions(app),
        positonals: [{name: 'argv', key: 'argv', repeatable: true}],
        execute() {},
    }
}

function parseGlobalOptions(app: AnyApp, argv: string[]): {opts?: Record<string, any>, result?: ExecutionResult} {
    try {
        const [, opts] = parseArgs(getHelpValidationCommand(createGlobalParseCommand(app)), argv)
        return {opts}
    } catch(err) {
        if(err instanceof UnknownOptionError) {
            return {}
        }
        const error = createError(err instanceof Error ? err.message : String(err), ErrorStyle.InvalidArg)
        return {
            result: {
                code: getErrorExitCode(error),
                error,
            },
        }
    }
}

function getOptionTokenConsumption(argv: readonly string[], index: number, rawOptions: readonly import('./interfaces').Option[]): number {
    const token = argv[index]
    if(token === '--') {
        return argv.length - index
    }
    if(!token.startsWith('-') || token === '-') {
        return 0
    }

    const options = rawOptions
    const matchLong = (name: string) =>
        options.find(opt => opt.name === name || (opt.noPrefix && `no-${opt.name}` === name) || (opt.alias !== undefined && (Array.isArray(opt.alias) ? opt.alias.includes(name) : opt.alias === name)))

    if(token.startsWith('--')) {
        const [left] = token.split('=', 1)
        const option = matchLong(left.slice(2))
        if(option === undefined) {
            return 0
        }
        if(left !== token || option.valueNotRequired) {
            return 1
        }
        return index < argv.length - 1 ? 2 : 1
    }

    const clusterText = token.slice(1)
    const equalIndex = clusterText.indexOf('=')
    const cluster = equalIndex === -1 ? clusterText : clusterText.slice(0, equalIndex)
    for(let i = 0; i < cluster.length; ++i) {
        const option = options.find(opt => opt.name === cluster[i] || (Array.isArray(opt.alias) ? opt.alias.includes(cluster[i]) : opt.alias === cluster[i]))
        if(option === undefined) {
            return 0
        }
        if(!option.valueNotRequired) {
            if(i < cluster.length - 1 || equalIndex !== -1) {
                return 1
            }
            return index < argv.length - 1 ? 2 : 1
        }
    }
    return 1
}

function resolveCommandWithGlobalOptions(argv: readonly string[], subCommands: readonly AnyCmd[], globalOptions: readonly import('./interfaces').Option[]): ResolvedCommand {
    const path: string[] = []
    const commandIndexes = new Set<number>()
    let command: AnyCmd | undefined
    let current = subCommands
    let index = 0

    while(index < argv.length) {
        const token = argv[index]
        const consumed = getOptionTokenConsumption(argv, index, globalOptions)
        if(consumed > 0) {
            index += consumed
            continue
        }

        const candidate = findSubCommand(token, current)
        if(candidate === undefined) {
            break
        }

        command = candidate
        commandIndexes.add(index)
        path.push(candidate.name)
        index += 1
        if(!hasSubCommands(candidate)) {
            break
        }
        current = candidate.subCommands
    }

    return {
        command,
        path,
        remainingArgv: argv.filter((_, argvIndex) => !commandIndexes.has(argvIndex)),
    }
}

function getFirstNonGlobalToken(argv: readonly string[], globalOptions: readonly import('./interfaces').Option[]): string | undefined {
    for(let index = 0; index < argv.length;) {
        const consumed = getOptionTokenConsumption(argv, index, globalOptions)
        if(consumed > 0) {
            index += consumed
            continue
        }
        return argv[index]
    }
    return undefined
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
        validateCommandConfig(mergeCommandOptions(app, cmd))
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
        const parseableCommand = mergeCommandOptions(app, cmd)
        const [, provisionalOpts] = parseArgs(getHelpValidationCommand(parseableCommand), rawArgs)
        applyParsedGlobalState(app, provisionalOpts)
        if(provisionalOpts.help) {
            if (cmd === app && !hasSubCommands(app)) {
                printHelp(app, getRootCommands(app))
                return {code: 0}
            }
            printCommandHelp(app, cmd, path)
            return {code: 0}
        }

        ;[args, opts] = parseArgs(parseableCommand, rawArgs)
        applyParsedGlobalState(app, opts)
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
    const rootCommands = getRootCommands(app)
    const globalOptions = getGlobalOptions(app)

    if (argv.length === 0) {
        if (isExecutable(app)) {
            return executeLeaf(app, normalizeAppAsLeafCommand(app), [], [])
        }
        printHelp(app, rootCommands)
        return {code: 0}
    }

    if (isExecutable(app) && !hasSubCommands(app)) {
        if (isVersionFlag(argv[0])) {
            printLn(app._version)
            return {code: 0}
        }
        const globalParse = parseGlobalOptions(app, argv)
        if(globalParse.result !== undefined) {
            return globalParse.result
        }
        if(globalParse.opts !== undefined) {
            applyParsedGlobalState(app, globalParse.opts)
        }
        if(globalParse.opts?.help) {
            return executeLeaf(app, normalizeAppAsLeafCommand(app), argv, [])
        }
        const builtin = findSubCommand(argv[0], rootCommands)
        if (builtin && isExecutable(builtin)) {
            return executeLeaf(app, builtin, argv.slice(1), [builtin.name])
        }
        return executeLeaf(app, normalizeAppAsLeafCommand(app), argv, [])
    }

    const resolved = resolveCommandWithGlobalOptions(argv, rootCommands, globalOptions)
    if (!resolved.command) {
        const globalParse = parseGlobalOptions(app, argv)
        if(globalParse.result !== undefined) {
            return globalParse.result
        }
        const globalOpts = globalParse.opts ?? {}
        applyParsedGlobalState(app, globalOpts)
        const firstNonGlobalToken = getFirstNonGlobalToken(argv, globalOptions)
        if(firstNonGlobalToken === undefined) {
            if(globalOpts.help || !hasSubCommands(app)) {
                if(isExecutable(app)) {
                    return executeLeaf(app, normalizeAppAsLeafCommand(app), argv, [])
                }
                printHelp(app, rootCommands)
                return {code: 0}
            }
            printHelp(app, rootCommands)
            return {code: 0}
        }
        return unknownCommandResult(app, firstNonGlobalToken)
    }

    if (hasSubCommands(resolved.command)) {
        const globalParse = parseGlobalOptions(app, resolved.remainingArgv)
        if(globalParse.result !== undefined) {
            return globalParse.result
        }
        const branchOpts = globalParse.opts ?? {}
        applyParsedGlobalState(app, branchOpts)
        const firstNonGlobalToken = getFirstNonGlobalToken(resolved.remainingArgv, globalOptions)
        if (!resolved.remainingArgv.length || (branchOpts.help && firstNonGlobalToken === undefined)) {
            printCommandHelp(app, resolved.command, resolved.path)
            return {code: 0}
        }
        return unknownCommandResult(app, firstNonGlobalToken ?? resolved.remainingArgv[0])
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
        printError(result.error, app.chalk)
    }
    return result.code ?? 0
}
