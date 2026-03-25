import type {AnyApp, AnyCmd, Option} from './interfaces'
import {Command, OptType, hasSubCommands} from './interfaces'
import {sortOptions, getCommand} from './options'
import {printHelp} from './app-help'
import {printCommandHelp} from './print-command-help'
import {printLn, sortBy, toArray} from './utils'

type BuiltinEntryConfig = {
    name: string
    alias?: string | string[]
    disableCommand?: boolean
    disableOption?: boolean
}

type BuiltinOptionConfig = {
    name: string
    alias?: string | string[]
    disableOption?: boolean
}

const DEFAULT_HELP_CONFIG: BuiltinEntryConfig = {
    name: 'help',
    alias: 'h',
}

const DEFAULT_VERSION_CONFIG: BuiltinEntryConfig = {
    name: 'version',
}

const DEFAULT_COLOR_CONFIG: BuiltinOptionConfig = {
    name: 'color',
}

function resolveBuiltinConfig(
    defaults: BuiltinEntryConfig,
    config?: {name?: string, alias?: string | string[], disableCommand?: boolean, disableOption?: boolean},
): BuiltinEntryConfig {
    return {
        ...defaults,
        ...(config ?? {}),
    }
}

export function getHelpConfig(app: AnyApp): BuiltinEntryConfig {
    return resolveBuiltinConfig(DEFAULT_HELP_CONFIG, app._helpConfig)
}

export function getVersionConfig(app: AnyApp): BuiltinEntryConfig {
    return resolveBuiltinConfig(DEFAULT_VERSION_CONFIG, app._versionConfig)
}

export function getColorConfig(app: AnyApp): BuiltinOptionConfig {
    return {
        ...DEFAULT_COLOR_CONFIG,
        ...(app._colorConfig ?? {}),
    }
}

function createBuiltinOption(
    key: 'help' | 'version',
    config: BuiltinEntryConfig,
    description: string,
): Option | undefined {
    if(config.disableOption) {
        return undefined
    }
    return {
        name: config.name,
        ...(config.alias !== undefined ? {alias: config.alias} : {}),
        description,
        key,
        type: OptType.BOOL,
        valueNotRequired: true,
        valueIfSet: true,
    }
}

function createHelpCommand(app: AnyApp): AnyCmd | undefined {
    const config = getHelpConfig(app)
    if(config.disableCommand) {
        return undefined
    }

    const command = new Command(config.name)
        .describe('Displays help for a command')
        .arg('command', {
            description: 'The command path.',
            repeatable: true,
        })
        .run(async ({command: commandPath = []}, context) => {
            const rootCommands = getRootCommands(context.app)

            if(commandPath.length) {
                const {command, path} = getCommand(commandPath, rootCommands)
                printCommandHelp(context, command, path)
            } else if(hasSubCommands(context.app)) {
                printHelp(context, rootCommands)
            } else {
                printCommandHelp(context, context.app, [])
            }
            return 0
        })

    const aliases = toArray(config.alias)
    if(aliases.length) {
        command.aliases(...aliases)
    }

    return command as unknown as AnyCmd
}

function createVersionCommand(app: AnyApp): AnyCmd | undefined {
    const config = getVersionConfig(app)
    if(config.disableCommand) {
        return undefined
    }

    const command = new Command(config.name)
        .describe('Displays current version')
        .run(async (_, context) => {
            printLn(context.app._version)
            return 0
        })

    const aliases = toArray(config.alias)
    if(aliases.length) {
        command.aliases(...aliases)
    }

    return command as unknown as AnyCmd
}

export function getHelpOption(app: AnyApp): Option | undefined {
    return createBuiltinOption('help', getHelpConfig(app), 'Show help text')
}

export function getVersionOption(app: AnyApp): Option | undefined {
    return createBuiltinOption('version', getVersionConfig(app), 'Show current version')
}

export function getColorOption(app: AnyApp): Option | undefined {
    const config = getColorConfig(app)
    if(config.disableOption) {
        return undefined
    }

    return {
        name: config.name,
        ...(config.alias !== undefined ? {alias: config.alias} : {}),
        description: 'Control ANSI color output.',
        key: 'color',
        type: OptType.ENUM,
        enumValues: ['always', 'never', 'auto'] as const,
        valuePlaceholder: 'WHEN',
        valueNotRequired: true,
        valueIfSet: 'always',
        noPrefix: true,
        valueIfNoPrefix: 'never',
        defaultValue: 'auto',
    }
}

export function getGlobalOptions(app: AnyApp): Option[] {
    return sortOptions([
        ...[getHelpOption(app), getVersionOption(app), getColorOption(app)].filter((value): value is Option => value !== undefined),
        ...(app._globalOptions ?? []),
    ])
}

export function getRootCommands(app: AnyApp): readonly AnyCmd[] {
    const userCommands = app.subCommands !== undefined
        ? sortBy(app.subCommands as readonly AnyCmd[], c => c.name)
        : []

    return [
        ...userCommands,
        ...[createVersionCommand(app), createHelpCommand(app)].filter((value): value is AnyCmd => value !== undefined),
    ] as const
}
