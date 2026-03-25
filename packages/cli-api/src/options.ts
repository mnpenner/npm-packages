import type {AnyCmd, AnyLeafCommand, AnyOptType, Argument, Option} from './interfaces'
import {OptType, hasSubCommands} from './interfaces'
import type {NullableObj} from './utils'
import {includes, resolve, sortBy, statSync, toArray, toBool} from './utils'
import type {ChalkInstance} from 'chalk'
import Path from 'path'
import FileSys from 'fs'

export interface ResolvedCommand {
    command: AnyCmd | undefined
    path: string[]
    remainingArgv: string[]
}

type ParseableCommand = Pick<AnyLeafCommand, 'name' | 'options' | 'positonals'>
type Repeatability = boolean | number | undefined
type Requirement = boolean | number | undefined

/**
 * Error thrown when argument parsing encounters an unknown option name.
 *
 * @param option The unrecognized option token, including its leading dashes.
 * @returns A parser error whose message matches the CLI's unknown-option wording.
 */
export class UnknownOptionError extends Error {
    readonly option: string

    constructor(option: string) {
        super(`option ${option} not recognized`)
        this.option = option
    }
}

function getEnumValues(item: {type?: AnyOptType, enumValues?: readonly string[]}): readonly string[] | undefined {
    if(Array.isArray(item.type)) {
        return item.type
    }
    if(item.type === OptType.ENUM) {
        return item.enumValues
    }
    return undefined
}

function getOptionImplicitValue(opt: Option): any {
    if(opt.valueIfSet !== undefined) {
        return resolve(opt.valueIfSet)
    }
    if(opt.type === OptType.BOOL) {
        return true
    }
    return !resolve(opt.defaultValue)
}

function getOptionNoPrefixValue(opt: Option): any {
    if(opt.valueIfNoPrefix !== undefined) {
        return resolve(opt.valueIfNoPrefix)
    }
    if(opt.type === OptType.BOOL) {
        return false
    }
    throw new Error(`\`${getOptName(opt)}\` option must define valueIfNoPrefix when noPrefix is enabled`)
}

function isRepeatable(value: Repeatability): boolean {
    return value === true || typeof value === 'number'
}

function getMaxRepeatCount(value: Repeatability): number | undefined {
    if(value === true || value === false || value === undefined) {
        return undefined
    }
    return value
}

function getMinRequiredCount(value: Requirement): number {
    if(value === true) {
        return 1
    }
    if(typeof value === 'number') {
        return value
    }
    return 0
}

function assertValidCount(name: string, value: number, {allowZero = false}: {allowZero?: boolean} = {}): void {
    if(!Number.isInteger(value) || value < 0 || (!allowZero && value === 0)) {
        throw new Error(`${name} must be ${allowZero ? 'a non-negative' : 'a positive'} integer`)
    }
}

function validatePositionalDefinitions(cmd: ParseableCommand): void {
    if(!cmd.positonals?.length) {
        return
    }

    let encounteredOptionalPositional = false
    for(let i = 0; i < cmd.positonals.length; ++i) {
        const arg = cmd.positonals[i]
        const repeatable = isRepeatable(arg.repeatable)
        const minRequired = getMinRequiredCount(arg.required)
        const maxRepeatCount = getMaxRepeatCount(arg.repeatable)

        if(typeof arg.required === 'number') {
            assertValidCount(`"${arg.name}" argument required count`, arg.required, {allowZero: true})
            if(!repeatable) {
                throw new Error(`"${arg.name}" argument cannot use a numeric required count unless it is repeatable`)
            }
        }
        if(typeof arg.repeatable === 'number') {
            assertValidCount(`"${arg.name}" argument repeatable count`, arg.repeatable)
        }
        if(repeatable && i < cmd.positonals.length - 1) {
            throw new Error('Only the last argument can be repeatable')
        }
        if(maxRepeatCount !== undefined && minRequired > maxRepeatCount) {
            throw new Error(`"${arg.name}" argument requires at least ${minRequired} values but allows at most ${maxRepeatCount}`)
        }
        if(encounteredOptionalPositional && minRequired > 0) {
            throw new Error('Required arguments cannot come after optional arguments')
        }
        if(minRequired === 0) {
            encounteredOptionalPositional = true
        }
    }
}

function pushRepeatableValue(target: any[], value: any, itemName: string, maxCount: number | undefined, kind: 'option' | 'argument'): void {
    if(maxCount !== undefined && target.length >= maxCount) {
        throw new Error(`"${itemName}" ${kind} allows at most ${maxCount} value${maxCount === 1 ? '' : 's'}`)
    }
    target.push(value)
}

/**
 * Formats an option definition for display in help output.
 *
 * @param opt The option metadata to render.
 * @returns A tuple containing the formatted flag label and its description text.
 */
export function formatOption(opt: Option, chalk: ChalkInstance): [string, string] {
    const aliases: string[] = []
    if(opt.alias) {
        if(Array.isArray(opt.alias)) {
            aliases.push(...opt.alias)
        } else {
            aliases.push(opt.alias)
        }
    }
    let flags = [...aliases.map(a => chalk.green(a.length === 1 ? `-${a}` : `--${a}`)), chalk.green(`--${opt.name}`)].join(', ')
    if(!opt.alias && opt.name.length > 1) {
        flags = `    ${flags}`
    }
    if(opt.type !== OptType.BOOL) {
        const valuePlaceholder = chalk.magenta(getValuePlaceholder(opt))
        flags += opt.valueNotRequired
            ? `${chalk.grey('[')}=${valuePlaceholder}${chalk.grey(']')}`
            : `=${valuePlaceholder}`
    }
    if(opt.noPrefix) {
        flags += `, ${chalk.green(`--no-${opt.name}`)}`
    }
    let desc = opt.description ?? ''
    let defaultValueText = opt.defaultValueText
    if(defaultValueText === undefined && opt.defaultValue !== undefined) {
        defaultValueText = JSON.stringify(resolve(opt.defaultValue))
    }
    if(defaultValueText !== undefined) {
        desc += chalk.yellow(` [default: ${defaultValueText}]`)
    }
    const enumValues = getEnumValues(opt)
    if(enumValues?.length) {
        desc += ` [possible values: ${enumValues.join(', ')}]`
    }
    return [flags, desc]
}

export function getValuePlaceholder(opt: Option): string {
    if(opt.valuePlaceholder !== undefined) {
        return opt.valuePlaceholder
    }
    const enumValues = getEnumValues(opt)
    if(enumValues !== undefined) {
        return enumValues.join('|').toUpperCase()
    } else if(opt.type == OptType.BOOL) {
        return JSON.stringify(!resolve(opt.defaultValue))
    } else if(opt.type === OptType.INT || opt.type === OptType.FLOAT) {
        return '#'
    } else if(opt.type === OptType.INPUT_FILE || opt.type === OptType.OUTPUT_FILE) {
        return 'FILE'
    } else if(opt.type === OptType.INPUT_DIRECTORY || opt.type === OptType.OUTPUT_DIRECTORY || opt.type === OptType.EMPTY_DIRECTORY) {
        return 'DIR'
    } else {
        return opt.name.toUpperCase()
    }
}

export function sortOptions(options: readonly Option[]): Option[] {
    return sortBy(options, option => option.name)
}

export function getOptions(cmd: ParseableCommand): Option[] {
    return sortOptions(toArray(cmd.options) as Option[])
}

/**
 * Validates a command's static option and positional configuration before parsing argv.
 *
 * @param cmd The command definition to validate.
 * @returns Nothing. Throws when the command configuration is internally inconsistent.
 */
export function validateCommandConfig(cmd: ParseableCommand): void {
    validatePositionalDefinitions(cmd)

    const seenOptionTokens = new Map<string, string>()
    for(const opt of getOptions(cmd)) {
        if(typeof opt.repeatable === 'number') {
            assertValidCount(`\`${opt.name}\` option repeatable count`, opt.repeatable)
        }
        if(opt.noPrefix && !opt.valueNotRequired) {
            throw new Error(`\`${getOptName(opt)}\` option cannot enable noPrefix unless valueNotRequired is enabled`)
        }
        if(opt.type === OptType.ENUM && !getEnumValues(opt)?.length) {
            throw new Error(`\`${getOptName(opt)}\` option must define enumValues when using OptType.ENUM`)
        }
        if(opt.noPrefix && opt.type !== OptType.BOOL && opt.valueIfNoPrefix === undefined) {
            throw new Error(`\`${getOptName(opt)}\` option must define valueIfNoPrefix when noPrefix is enabled`)
        }

        const tokens = new Set<string>([opt.name])
        for(const alias of toArray(opt.alias)) {
            tokens.add(alias)
        }
        if(opt.noPrefix) {
            tokens.add(`no-${opt.name}`)
        }

        for(const token of tokens) {
            const existing = seenOptionTokens.get(token)
            if(existing !== undefined) {
                const currentName = token.startsWith('no-') ? `--${token}` : getOptName(opt)
                throw new Error(`Option token \`${currentName}\` collides with \`${existing}\``)
            }

            const displayName = token.startsWith('no-')
                ? `--${token}`
                : (token.length === 1 ? `-${token}` : `--${token}`)
            seenOptionTokens.set(token, displayName)
        }
    }
}

export function parseArgs(cmd: ParseableCommand, argv: string[], chalk: ChalkInstance): [any[], Record<string, any>] {
    const args: any[] = []
    const opts: Record<string, any> = Object.create(null)
    let parseFlags = true

    const allOptions = getOptions(cmd)
    validateCommandConfig(cmd)

    for(const opt of allOptions) {
        if(isRepeatable(opt.repeatable)) {
            const k = opt.key ?? opt.name
            if(opts[k] === undefined) opts[k] = []
        }
    }
    if(cmd.positonals?.length) {
        for(let i = 0; i < cmd.positonals.length; ++i) {
            const a: Argument = cmd.positonals[i]
            if(isRepeatable(a.repeatable)) {
                const k = a.key ?? a.name
                if(k && opts[k] === undefined) opts[k] = []
            }
        }
    }

    const findOpt = (name: string): {opt: Option, negated: boolean} | undefined => {
        const option = allOptions.find(o => o.name === name || includes(name, o.alias))
        if(option !== undefined) {
            return {opt: option, negated: false}
        }
        const negatedOption = allOptions.find(o => o.noPrefix && `no-${o.name}` === name)
        if(negatedOption !== undefined) {
            return {opt: negatedOption, negated: true}
        }
        return undefined
    }

    const getUnknownShortOption = (cluster: string): string | undefined => {
        for(let j = 0; j < cluster.length; ++j) {
            const ch = cluster[j]
            if(!findOpt(ch)) {
                return ch
            }
        }
        return undefined
    }

    let argIdx = 0
    for(let i = 0; i < argv.length; ++i) {
        let token = argv[i]

        if(parseFlags && token === '--') {
            parseFlags = false
            continue
        }

        if(parseFlags && token.length >= 2 && token.startsWith('-')) {
            let inlineValue: any

            if(token.startsWith('--')) {
                if(token.includes('=')) {
                    const [left, right] = token.split('=', 2)
                    token = left
                    inlineValue = right
                }
                const name = token.slice(2)
                const match = findOpt(name)
                if(!match) throw new UnknownOptionError(`--${name}`)
                const {opt, negated} = match
                if(negated && inlineValue !== undefined) {
                    throw new Error(`Option \`--no-${opt.name}\` does not take a value`)
                }
                let value = inlineValue
                if(negated) {
                    value = getOptionNoPrefixValue(opt)
                } else if(value === undefined) {
                    if(opt.valueNotRequired) {
                        value = getOptionImplicitValue(opt)
                    } else if(i < argv.length - 1) {
                        value = argv[++i]
                    } else {
                        throw new Error(`Missing required value for option \`${token}\``)
                    }
                }
                if(opt.type != null) value = coerceType(value, opt.type, chalk, `option \`${token}\``, getEnumValues(opt))
                const k = opt.key ?? opt.name
                if(isRepeatable(opt.repeatable)) {
                    pushRepeatableValue(opts[k] as any[], value, opt.name, getMaxRepeatCount(opt.repeatable), 'option')
                }
                else opts[k] = value
            } else {
                const clusterText = token.slice(1)
                const equalIndex = clusterText.indexOf('=')
                const cluster = equalIndex === -1 ? clusterText : clusterText.slice(0, equalIndex)
                const hasInlineAssignment = equalIndex !== -1
                inlineValue = equalIndex === -1 ? undefined : clusterText.slice(equalIndex + 1)
                if(hasInlineAssignment) {
                    const unknownOption = getUnknownShortOption(cluster)
                    if(unknownOption !== undefined) {
                        throw new UnknownOptionError(`-${unknownOption}`)
                    }
                }
                let j = 0
                while(j < cluster.length) {
                    const ch = cluster[j]
                    const match = findOpt(ch)
                    if(!match) throw new UnknownOptionError(`-${ch}`)
                    const {opt} = match

                    if(opt.valueNotRequired) {
                        const k = opt.key ?? opt.name
                        const v = getOptionImplicitValue(opt)
                        if(isRepeatable(opt.repeatable)) {
                            pushRepeatableValue(opts[k] as any[], v, opt.name, getMaxRepeatCount(opt.repeatable), 'option')
                        }
                        else opts[k] = v
                        j += 1
                        continue
                    }

                    let value: any
                    const remainder = cluster.slice(j + 1)
                    if(remainder.length && !hasInlineAssignment) value = remainder
                    else if(remainder.length && hasInlineAssignment) throw new Error(`Missing required value for option \`-${ch}\``)
                    else if(inlineValue !== undefined && remainder.length === 0) value = inlineValue
                    else if(i < argv.length - 1) value = argv[++i]
                    else throw new Error(`Missing required value for option "-${ch}"`)

                    if(opt.type != null) value = coerceType(value, opt.type, chalk, `option \`-${ch}\``, getEnumValues(opt))
                    const k = opt.key ?? opt.name
                    if(isRepeatable(opt.repeatable)) {
                        pushRepeatableValue(opts[k] as any[], value, opt.name, getMaxRepeatCount(opt.repeatable), 'option')
                    }
                    else opts[k] = value
                    break
                }
            }
        } else {
            let value: any = token
            const def = cmd.positonals?.[argIdx]

            if(def) {
                if(def.type != null) value = coerceType(value, def.type, chalk, `argument \`${def.name}\``, getEnumValues(def))

                const k = def.key ?? def.name
                if(isRepeatable(def.repeatable)) {
                    const arr = (opts[k] ??= [])
                    pushRepeatableValue(arr, value, def.name, getMaxRepeatCount(def.repeatable), 'argument')
                    for(i = i + 1; i < argv.length; ++i) {
                        let v: any = argv[i]
                        if(parseFlags && v === '--') {
                            parseFlags = false
                            continue
                        }
                        if(parseFlags && v.startsWith('-')) {
                            i -= 1
                            break
                        }
                        if(def.type != null) v = coerceType(v, def.type, chalk, `argument \`${def.name}\``, getEnumValues(def))
                        pushRepeatableValue(arr, v, def.name, getMaxRepeatCount(def.repeatable), 'argument')
                    }
                    argIdx = isRepeatable(def.repeatable) && cmd.positonals ? cmd.positonals.length : argIdx
                    args.push(...arr)
                    continue
                } else {
                    opts[k] = value
                }
            }

            args.push(value)
            ++argIdx
        }
    }

    if(allOptions.length) {
        for(const opt of allOptions) {
            const k = opt.key ?? opt.name
            if(opts[k] === undefined) {
                if(opt.defaultValue !== undefined) {
                    opts[k] = resolve(opt.defaultValue)
                } else if(opt.required) {
                    throw new Error(`\`${getOptName(opt)}\` option is required`)
                }
            }
        }
    }

    if(cmd.positonals?.length) {
        for(let i = 0; i < cmd.positonals.length; ++i) {
            const a: any = cmd.positonals[i]
            const minRequired = getMinRequiredCount(a.required)
            if(minRequired > 0 && argIdx <= i && !isRepeatable(a.repeatable)) {
                throw new Error(`\`${a.name}\` argument is required`)
            }
            const k = a.key ?? a.name
            if(isRepeatable(a.repeatable) && ((opts[k] as any[] | undefined)?.length ?? 0) < minRequired) {
                throw new Error(`\`${a.name}\` argument requires at least ${minRequired} value${minRequired === 1 ? '' : 's'}`)
            }
            if(k && opts[k] === undefined && a.defaultValue !== undefined) {
                opts[k] = resolve(a.defaultValue)
            }
        }
    }

    return [args, opts]
}

function coerceType(
    value: string,
    type: AnyOptType,
    chalk: ChalkInstance,
    itemName?: string,
    enumValues?: readonly string[],
) {
    const normalizedEnumValue = () => {
        const normalized = String(value).trim().toLowerCase()
        const allowedValues = enumValues ?? (Array.isArray(type) ? type : undefined)
        if(allowedValues !== undefined && !allowedValues.includes(normalized)) {
            const itemText = itemName ? ` for ${itemName}` : ''
            throw new Error(`Invalid value "${value}"${itemText} (expected one of: ${allowedValues.join(', ')})`)
        }
        return normalized
    }
    if(Array.isArray(type)) {
        return normalizedEnumValue()
    }
    switch(type) {
        case OptType.BOOL:
            return toBool(value)
        case OptType.INT:
            return Math.trunc(Number(value))
        case OptType.FLOAT:
            return Number(value)
        case OptType.ENUM:
            return normalizedEnumValue()
        case OptType.STRING:
            return String(value)
        case OptType.INPUT_FILE: {
            if(value === '-') return '/dev/stdin'
            const file = Path.normalize(value)
            const fullPath = Path.resolve(file)
            const stat = statSync(file)
            if(!stat) {
                throw new Error(`File ${chalk.underline(fullPath)} does not exist`)
            }
            if(!stat.isFile()) {
                throw new Error(`${chalk.underline(fullPath)} is not a file`)
            }
            try {
                FileSys.accessSync(file, FileSys.constants.R_OK)
            } catch(err) {
                throw new Error(`${chalk.underline(fullPath)} is not readable`)
            }
            return file
        }
        case OptType.INPUT_DIRECTORY: {
            const dir = Path.normalize(value)
            FileSys.accessSync(dir, FileSys.constants.X_OK)
            return dir
        }
        case OptType.OUTPUT_FILE: {
            if(value === '-') return '/dev/stdout'
            const file = Path.normalize(value)
            const stat = statSync(file)
            if(stat) {
                if(!stat.isFile()) {
                    throw new Error(`'${file}' is not a file`)
                }
                FileSys.accessSync(file, FileSys.constants.W_OK)
            } else {
                FileSys.accessSync(Path.dirname(file), FileSys.constants.W_OK)
            }
            return file
        }
        case OptType.OUTPUT_DIRECTORY: {
            FileSys.accessSync(value, FileSys.constants.W_OK)
            return Path.normalize(value)
        }
        case OptType.EMPTY_DIRECTORY: {
            const dir = Path.normalize(value)
            let files = []
            try {
                files = FileSys.readdirSync(dir)
            } catch(err) {
                if((err as NullableObj)?.code === 'ENOENT') {
                    FileSys.accessSync(Path.dirname(dir), FileSys.constants.W_OK)
                } else {
                    throw err
                }
            }
            if(files.length) {
                throw new Error(`${chalk.underline(dir)} is not empty`)
            }
            return dir
        }
    }
    return value
}

export function getOptName(opt: Option) {
    return (opt.name.length > 1 ? '--' : '-') + opt.name
}

export function findSubCommand(name: string, subCommands: readonly AnyCmd[]): AnyCmd | undefined {
    const cmdName = String(name).trim().replace(/^-{1,2}/, '').toLowerCase()
    return subCommands.find(c => c.name === cmdName || includes(cmdName, c.alias))
}

export function resolveCommand(argv: readonly string[], subCommands: readonly AnyCmd[]): ResolvedCommand {
    const path: string[] = []
    let command: AnyCmd | undefined
    let current = subCommands
    let index = 0

    while(index < argv.length) {
        const candidate = findSubCommand(argv[index], current)
        if(!candidate) {
            break
        }
        command = candidate
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
        remainingArgv: argv.slice(index),
    }
}

export function getCommand(path: readonly string[], subCommands: readonly AnyCmd[]): {command: AnyCmd, path: string[]} {
    if(!path.length) {
        throw new Error('Command path is required.')
    }

    let current = subCommands
    let command: AnyCmd | undefined
    const resolvedPath: string[] = []

    for(let i = 0; i < path.length; ++i) {
        const segment = path[i]
        const next = findSubCommand(segment, current)
        if(next === undefined) {
            throw new Error(`Command "${segment}" does not exist.`)
        }
        command = next
        resolvedPath.push(next.name)
        if(i < path.length - 1) {
            if(!hasSubCommands(next)) {
                throw new Error(`Command "${resolvedPath.join(' ')}" does not have subCommands.`)
            }
            current = next.subCommands
        }
    }

    return {command: command!, path: resolvedPath}
}
