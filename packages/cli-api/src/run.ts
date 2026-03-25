import type {AnyApp, AnyCmd, AnyLeafCommand} from './interfaces'
import {ExecutionContext, getExecuteHandler, hasSubCommands, isExecutable} from './interfaces'
import {printHelp} from './app-help'
import type {ResolvedCommand} from './options'
import {findSubCommand, parseArgs, UnknownOptionError, validateCommandConfig} from './options'
import type {CliError} from './utils'
import {createError, ErrorCategory, getErrorExitCode, getProcName, printError} from './utils'
import {printCommandHelp} from './print-command-help'
import {printLn} from './utils'
import {getGlobalOptions, getRootCommands} from './builtins'
import {createChalk, type ColorMode} from './color'

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

type ExecutionOutcome = {
    result: ExecutionResult
    context: ExecutionContext
}

function mergeCommandOptions(app: AnyApp, cmd: AnyLeafCommand): AnyLeafCommand {
    const normalized = normalizeLeafCommand(cmd)
    return {
        ...normalized,
        options: [...getGlobalOptions(app), ...(normalized.options ?? [])],
    }
}

function createExecutionContext(app: AnyApp, opts?: Record<string, any>, path: readonly string[] = []): ExecutionContext {
    return new ExecutionContext(app, opts?.color ?? 'auto', path)
}

function createGlobalParseCommand(app: AnyApp): AnyLeafCommand {
    return {
        name: app.name,
        options: getGlobalOptions(app),
        positonals: [{name: 'argv', key: 'argv', repeatable: true}],
        execute() {},
    }
}

function getRequestedColorMode(argv: readonly string[]): ColorMode {
    let mode: ColorMode = 'auto'
    for(const token of argv) {
        if(token === '--color') {
            mode = 'always'
            continue
        }
        if(token === '--no-color') {
            mode = 'never'
            continue
        }
        if(token.startsWith('--color=')) {
            const value = token.slice('--color='.length)
            if(value === 'always' || value === 'never' || value === 'auto') {
                mode = value
            } else {
                mode = 'never'
            }
        }
    }
    return mode
}

function parseGlobalOptions(app: AnyApp, argv: string[]): {opts?: Record<string, any>, result?: ExecutionResult} {
    const colorMode = getRequestedColorMode(argv)
    try {
        const [, opts] = parseArgs(
            createGlobalParseCommand(app),
            extractGlobalOptionArgv(argv, getGlobalOptions(app)),
            createChalk(colorMode),
            {
                skipRequiredOptions: true,
                skipRequiredPositionals: true,
            },
        )
        return {opts}
    } catch(err) {
        if(err instanceof UnknownOptionError) {
            return {}
        }
        const error = createError(err instanceof Error ? err.message : String(err), ErrorCategory.InvalidArg)
        return {
            opts: {color: colorMode},
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

function extractGlobalOptionArgv(argv: readonly string[], globalOptions: readonly import('./interfaces').Option[]): string[] {
    const extracted: string[] = []

    for(let index = 0; index < argv.length;) {
        const consumed = getOptionTokenConsumption(argv, index, globalOptions)
        if(consumed > 0) {
            extracted.push(...argv.slice(index, index + consumed))
            index += consumed
            continue
        }
        index += 1
    }

    return extracted
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
    const error = createError(`${getProcName(app)}: unknown command '${commandName}'`, ErrorCategory.InvalidArg)
    return {
        code: getErrorExitCode(error),
        error,
    }
}

async function executeLeaf(app: AnyApp, cmd: AnyLeafCommand, rawArgs: string[], path: readonly string[]): Promise<ExecutionOutcome> {
    try {
        validateCommandConfig(mergeCommandOptions(app, cmd))
    } catch (err) {
        const error = createError(formatConfigError(err), ErrorCategory.Misconfig)
        return {
            result: {
                code: getErrorExitCode(error),
                error,
            },
            context: createExecutionContext(app, undefined, path),
        }
    }

    let opts: Record<string, any>
    const globalParse = parseGlobalOptions(app, rawArgs)
    if(globalParse.result !== undefined) {
        return {
            result: globalParse.result,
            context: createExecutionContext(app, globalParse.opts, path),
        }
    }
    const parseChalk = createChalk(globalParse.opts?.color ?? 'auto')
    try {
        const parseableCommand = mergeCommandOptions(app, cmd)
        const [, provisionalOpts] = parseArgs(parseableCommand, rawArgs, parseChalk, {
            skipRequiredOptions: true,
            skipRequiredPositionals: true,
        })
        const provisionalContext = createExecutionContext(app, provisionalOpts, path)
        if(provisionalOpts.help) {
            if (cmd === app && !hasSubCommands(app)) {
                printHelp(provisionalContext, getRootCommands(app))
                return {result: {code: 0}, context: provisionalContext}
            }
            printCommandHelp(provisionalContext, cmd, path)
            return {result: {code: 0}, context: provisionalContext}
        }
        if(provisionalOpts.version) {
            printLn(app._version)
            return {result: {code: 0}, context: provisionalContext}
        }
        ;[, opts] = parseArgs(parseableCommand, rawArgs, parseChalk)
    } catch (err) {
        if(err instanceof UnknownOptionError) {
            const error = createError(`${getProcName(app)}: ${err.message}`, ErrorCategory.InvalidArg)
            return {
                result: {
                    code: getErrorExitCode(error),
                    error,
                },
                context: createExecutionContext(app, globalParse.opts, path),
            }
        }
        const error = createError(err instanceof Error ? err.message : String(err), ErrorCategory.InvalidArg)
        return {
            result: {
                code: getErrorExitCode(error),
                error,
            },
            context: createExecutionContext(app, globalParse.opts, path),
        }
    }

    const handler = getExecuteHandler(cmd)
    if(handler === undefined) {
        const error = createError('Command is not executable.', ErrorCategory.Internal)
        return {
            result: {
                code: getErrorExitCode(error),
                error,
            },
            context: createExecutionContext(app, opts, path),
        }
    }

    try {
        const context = createExecutionContext(app, opts, path)
        const code = await Promise.resolve(handler(opts as any, context))
        if(code === undefined) {
            return {result: {code: null}, context}
        }
        return {result: {code}, context}
    } catch (err) {
        const error = createError(String((err as any)?.stack ?? err), ErrorCategory.Internal)
        return {
            result: {
                code: getErrorExitCode(error),
                error,
            },
            context: createExecutionContext(app, opts, path),
        }
    }
}

async function executeAppDetailed(app: AnyApp, argv: string[] = process.argv.slice(2)): Promise<ExecutionOutcome> {
    const rootCommands = getRootCommands(app)
    const globalOptions = getGlobalOptions(app)
    const rootContext = createExecutionContext(app)

    if (argv.length === 0) {
        if (isExecutable(app)) {
            return executeLeaf(app, normalizeAppAsLeafCommand(app), [], [])
        }
        printHelp(rootContext, rootCommands)
        return {result: {code: 0}, context: rootContext}
    }

    if (isExecutable(app) && !hasSubCommands(app)) {
        const globalParse = parseGlobalOptions(app, argv)
        if(globalParse.result !== undefined) {
            return {result: globalParse.result, context: createExecutionContext(app, globalParse.opts)}
        }
        if(globalParse.opts?.version) {
            printLn(app._version)
            return {result: {code: 0}, context: createExecutionContext(app, globalParse.opts)}
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
            return {result: globalParse.result, context: createExecutionContext(app, globalParse.opts)}
        }
        const globalOpts = globalParse.opts ?? {}
        const context = createExecutionContext(app, globalOpts)
        if(globalOpts.version) {
            printLn(app._version)
            return {result: {code: 0}, context}
        }
        const firstNonGlobalToken = getFirstNonGlobalToken(argv, globalOptions)
        if(firstNonGlobalToken === undefined) {
            if(globalOpts.help || !hasSubCommands(app)) {
                if(isExecutable(app)) {
                    return executeLeaf(app, normalizeAppAsLeafCommand(app), argv, [])
                }
                printHelp(context, rootCommands)
                return {result: {code: 0}, context}
            }
            printHelp(context, rootCommands)
            return {result: {code: 0}, context}
        }
        return {result: unknownCommandResult(app, firstNonGlobalToken), context}
    }

    if (hasSubCommands(resolved.command)) {
        const globalParse = parseGlobalOptions(app, resolved.remainingArgv)
        if(globalParse.result !== undefined) {
            return {result: globalParse.result, context: createExecutionContext(app, globalParse.opts, resolved.path)}
        }
        const branchOpts = globalParse.opts ?? {}
        const context = createExecutionContext(app, branchOpts, resolved.path)
        if(branchOpts.version) {
            printLn(app._version)
            return {result: {code: 0}, context}
        }
        const firstNonGlobalToken = getFirstNonGlobalToken(resolved.remainingArgv, globalOptions)
        if (!resolved.remainingArgv.length || (branchOpts.help && firstNonGlobalToken === undefined)) {
            printCommandHelp(context, resolved.command, resolved.path)
            return {result: {code: 0}, context}
        }
        return {result: unknownCommandResult(app, firstNonGlobalToken ?? resolved.remainingArgv[0]), context}
    }

    if (!isExecutable(resolved.command)) {
        const error = createError('Command is not executable.', ErrorCategory.Internal)
        return {
            result: {
                code: getErrorExitCode(error),
                error,
            },
            context: createExecutionContext(app, undefined, resolved.path),
        }
    }

    return executeLeaf(app, resolved.command, resolved.remainingArgv, resolved.path)
}

/**
 * Parses CLI arguments and returns the resulting exit code and optional error message.
 *
 * @param app The app to execute.
 * @param argv The raw CLI arguments to parse. Defaults to `process.argv.slice(2)`.
 * @returns The execution result, including any user-facing error text that should be printed.
 */
export async function executeAppResult(app: AnyApp, argv: string[] = process.argv.slice(2)): Promise<ExecutionResult> {
    const {result} = await executeAppDetailed(app, argv)
    return result
}

/**
 * Parses CLI arguments, prints any resulting error, and executes the matching command.
 *
 * @param app The app to execute.
 * @param argv The raw CLI arguments to parse. Defaults to `process.argv.slice(2)`.
 * @returns The process exit code for the CLI invocation.
 */
export async function executeApp(app: AnyApp, argv: string[] = process.argv.slice(2)): Promise<number> {
    const {result, context} = await executeAppDetailed(app, argv)
    if(result.error !== undefined) {
        printError(result.error, context.chalk)
    }
    return result.code ?? 0
}
