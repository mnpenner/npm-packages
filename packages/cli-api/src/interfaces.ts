import type {ChalkInstance, ColorSupportLevel} from 'chalk'
import {createChalk, type ColorMode} from './color'

// union -> intersection
type U2I<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

type OptionalKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>

type Flatten<T> = { [K in keyof T]: T[K] } & {}

type Simplify<T> = {
    [K in RequiredKeys<T>]: T[K]
} & {
    [K in OptionalKeys<T>]?: Exclude<T[K], undefined>
}

type PrimitiveOfOptType<T extends AnyOptType | undefined> =
    T extends undefined ? string :
        T extends OptType.STRING ? string :
            T extends OptType.BOOL ? boolean :
                T extends OptType.INT | OptType.FLOAT ? number :
                    T extends OptType.INPUT_FILE | OptType.INPUT_DIRECTORY | OptType.OUTPUT_FILE |
                        OptType.OUTPUT_DIRECTORY | OptType.EMPTY_DIRECTORY ? string :
                        T extends readonly (infer L)[] ? (L extends string ? L : string) :
                            string

// literal property key: prefer `key`, else `name`
type KeyOfItem<I> =
    I extends { key: infer K extends string } ? K :
        I extends { name: infer N extends string } ? N :
            never

// ----- options & flags -----
type TypeOfItem<I> = I extends { type: infer T extends AnyOptType } ? T : undefined
type IsRepeatable<I> = I extends { repeatable: true | number } ? true : false
type IsRequired<I> = I extends { required: true | number } ? true : false
type IsAlwaysPresent<I> = IsRepeatable<I> extends true ? true : IsRequired<I>

type ValueOfOption<O extends Option> =
    IsRepeatable<O> extends true
        ? PrimitiveOfOptType<TypeOfItem<O>>[]
        : PrimitiveOfOptType<TypeOfItem<O>>

type OptionPropMap<I extends Option> = { [K in KeyOfItem<I>]: ValueOfOption<I> }
type FlagPropMap<F extends Flag> = { [K in KeyOfItem<F>]: boolean }

type MergeOptionProps<IU extends Option> = U2I<IU extends any ? OptionPropMap<IU> : never>
type MergeFlagProps<FU extends Flag> = U2I<FU extends any ? FlagPropMap<FU> : never>

type RequiredOptions<I extends Option> = I extends any ? (IsAlwaysPresent<I> extends true ? I : never) : never
type OptionalOptions<I extends Option> = Exclude<I, RequiredOptions<I>>

export type OptionsOf<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined
> =
    (Opts extends readonly any[] ? (
        MergeOptionProps<RequiredOptions<Opts[number]>> &
        Partial<MergeOptionProps<OptionalOptions<Opts[number]>>>
    ) : {}) &
    (Flags extends readonly any[] ? Partial<MergeFlagProps<Flags[number]>> : {})

// ----- positonals (never boolean) -----
type ValueOfArg<A extends Argument> =
    IsRepeatable<A> extends true
        ? PrimitiveOfOptType<TypeOfItem<A>>[]
        : PrimitiveOfOptType<TypeOfItem<A>>

type _ArgsFixed<As extends readonly Argument[], Acc extends unknown[] = []> =
    As extends readonly [infer A, ...infer R]
        ? A extends Argument
            ? IsRepeatable<A> extends true ? Acc
                : _ArgsFixed<R & readonly Argument[], [...Acc, ValueOfArg<A>]>
            : Acc
        : Acc

type _ArgsTailRepeat<As extends readonly Argument[]> =
    As extends readonly [...infer _, infer L]
        ? L extends Argument ? (IsRepeatable<L> extends true ? PrimitiveOfOptType<TypeOfItem<L>> : never) : never
        : never

type ArgumentPropMap<I extends Argument> = { [K in KeyOfItem<I>]: ValueOfArg<I> }
type MergeArgumentProps<IU extends Argument> = U2I<IU extends any ? ArgumentPropMap<IU> : never>
type RequiredArguments<I extends Argument> = I extends any ? (IsAlwaysPresent<I> extends true ? I : never) : never
type OptionalArguments<I extends Argument> = Exclude<I, RequiredArguments<I>>

export type ArgsOf<As extends readonly Argument[] | undefined> =
    As extends readonly Argument[]
        ? _ArgsTailRepeat<As> extends never
            ? _ArgsFixed<As>
            : [..._ArgsFixed<As>, ..._ArgsTailRepeat<As>[]]
        : unknown[]

export type OptsOf<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> = Simplify<
    OptionsOf<Opts, Flags> &
    (As extends readonly any[] ? (
        MergeArgumentProps<RequiredArguments<As[number]>> &
        Partial<MergeArgumentProps<OptionalArguments<As[number]>>>
    ) : {})
>

export type MaybePromise<V> = V | PromiseLike<V>

export enum OptType {
    STRING,
    BOOL,
    INT,
    FLOAT,
    /** A string, truncated and converted to lowercase. */
    ENUM,
    /** File must be readable. Single dash will be converted to STDIN. */
    INPUT_FILE,
    /** Directory must be readable. */
    INPUT_DIRECTORY,
    /** File's directory must exist and be writeable. Single dash will be converted to STDOUT. */
    OUTPUT_FILE,
    OUTPUT_DIRECTORY,
    /** An empty or non-existent directory. */
    EMPTY_DIRECTORY,
}

interface ArgumentOrOptionOrFlag {
    /** Name of the option to display in help. */
    name: string
    /** Alternative name for this option. */
    alias?: string | string[]
    /** Description of the option. */
    description?: string
    /** Default value to display in help. */
    defaultValueText?: string
    /** Property name to use in `run()` opts. */
    key?: string
}

export type AnyOptType = OptType | readonly string[]

export interface ArgumentOrOption extends ArgumentOrOptionOrFlag {
    /** Type to coerce the option value to. */
    type?: AnyOptType
    /** Allowed values for `OptType.ENUM`. */
    enumValues?: readonly string[]
    /** Option or positional may be provided more than once. When set to a number, that number is the maximum count. */
    repeatable?: boolean | number
    /** Option or positional is required. For repeatable positionals, a number means the minimum count required. */
    required?: boolean | number
    /** Default value if not provided. */
    defaultValue?: any | (() => any)
}

/** Same as options, but the type is bool and a value is not required. */
export interface Flag extends ArgumentOrOptionOrFlag, OptionOrFlag {
    valueNotRequired?: true
    /** Default value if not provided. */
    defaultValue?: boolean | (() => boolean)
}

/** Positional argument. */
export interface Argument extends ArgumentOrOption {
}

interface OptionOrFlag {
    /** Add a `--no-${name}` long-form alias that uses `valueIfNoPrefix` or `false`. */
    noPrefix?: boolean
    /** Value to use when the option is present without an explicit value. */
    valueIfSet?: any | (() => any)
    /** Value to use when the `--no-${name}` form is provided. */
    valueIfNoPrefix?: any | (() => any)
}

/** Option with value. */
export interface Option extends ArgumentOrOption, OptionOrFlag {
    /** Placeholder value to use in help. */
    valuePlaceholder?: string
    /** Caller may specify a value (`--opt=value`), but it's not required. When omitted, `valueIfSet` is used. */
    valueNotRequired?: boolean
}

type CommandBase = {
    name: string
    alias?: string | string[]
    description?: string
    longDescription?: string
}

type AppBase = CommandBase & {
    globalOptions?: Option[]
}

export type AnyApp = App<any, any, any, any, any>

export type LeafCommand<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
> = LeafCommandInput<Opts, Flags, As>

export type BranchCommand<
    Cs extends CommandChildren = CommandChildren,
> = BranchCommandInput<Cs>

export type CommandShape<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
    Cs extends CommandChildren = CommandChildren,
> = LeafCommand<Opts, Flags, As> | BranchCommand<Cs>

export type CommandChildren = readonly CommandShape<any, any, any, any>[]

export interface ExecutableInput<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> {
    options?: Opts
    flags?: Flags
    positonals?: As
    execute(opts: OptsOf<Opts, Flags, As>, context: ExecutionContext): MaybePromise<number | void>
}

export interface LeafCommandInput<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> extends CommandBase, ExecutableInput<Opts, Flags, As> {
    subCommands?: never
}

export interface BranchCommandInput<Cs extends CommandChildren> extends CommandBase {
    subCommands: Cs
    options?: never
    flags?: never
    positonals?: never
    execute?: never
}

export type LeafApp<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
> = LeafAppInput<Opts, Flags, As>

export type BranchApp<
    Cs extends CommandChildren = CommandChildren,
> = BranchAppInput<Cs>

export type AppShape<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
    Cs extends CommandChildren = CommandChildren,
> = LeafApp<Opts, Flags, As> | BranchApp<Cs>

/**
 * Per-invocation execution state exposed to command handlers.
 */
export class ExecutionContext {
    private readonly _app: AnyApp
    private readonly _commandPath: readonly string[]
    private readonly _chalk: ChalkInstance

    /**
     * Creates a context for a single CLI invocation.
     *
     * @param app The root app being executed.
     * @param colorMode The resolved color mode for the current invocation.
     * @param path The resolved command path for the current invocation.
     */
    constructor(app: AnyApp, colorMode: ColorMode = 'auto', path: readonly string[] = []) {
        this._app = app
        this._commandPath = path
        this._chalk = createChalk(colorMode)
    }

    /**
     * Gets the root app for the current invocation.
     *
     * @returns The app definition being executed.
     */
    get app(): AnyApp {
        return this._app
    }

    /**
     * Gets the resolved command path for the current invocation.
     *
     * @returns The command names from the app root to the executing command.
     */
    get commandPath(): readonly string[] {
        return this._commandPath
    }

    /**
     * Gets the chalk instance configured for the current invocation.
     *
     * @returns The active chalk instance after built-in color flags such as `--color` and `--no-color` have been applied.
     */
    get chalk(): ChalkInstance {
        return this._chalk
    }

    /**
     * Gets the resolved color support level configured for the current invocation.
     *
     * @returns The active color level from `0` to `3`.
     */
    get colorLevel(): ColorSupportLevel {
        return this._chalk.level
    }
}

export interface LeafAppInput<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> extends AppBase, ExecutableInput<Opts, Flags, As> {
    subCommands?: never
}

export interface BranchAppInput<Cs extends CommandChildren> extends AppBase {
    subCommands: Cs
    options?: never
    flags?: never
    positonals?: never
    execute?: never
}

export interface AnyLeafCommand extends CommandBase {
    options?: readonly Option[] | undefined
    flags?: readonly Flag[] | undefined
    positonals?: readonly Argument[] | undefined
    execute(opts: Record<string, any>, context: ExecutionContext): MaybePromise<number | void>
    subCommands?: never | undefined
}

export interface AnyBranchCommand extends CommandBase {
    subCommands: readonly AnyCmd[]
    options?: never | undefined
    flags?: never | undefined
    positonals?: never | undefined
    execute?: never | undefined
}

export type AnyCmd = AnyLeafCommand | AnyBranchCommand

type FlagConfigInput = Omit<Flag, 'name' | 'valueNotRequired'>
type OptionConfigInput = Omit<Option, 'name'>
type ArgumentConfigInput = Omit<Argument, 'name'>

type BuildFlag<Name extends string, Config extends FlagConfigInput | undefined> = Flatten<
    { name: Name } &
    (Config extends undefined ? {} : Config)
>

type BuildOption<Name extends string, Config extends OptionConfigInput | undefined> = Flatten<
    { name: Name } &
    (Config extends undefined ? {} : Config)
>

type BuildArgument<Name extends string, Config extends ArgumentConfigInput | undefined> = Flatten<
    { name: Name } &
    (Config extends undefined ? {} : Config)
>

export type RunHandler<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> = (opts: OptsOf<Opts, Flags, As>, context: ExecutionContext) => MaybePromise<number | void>

type ExecuteHandler<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> = ExecutableInput<Opts, Flags, As>['execute']

type AppMetaConfig = {
    bin?: string
    version?: string
    author?: string
    description?: string
    longDescription?: string
}

interface BuiltinEntryConfig {
    /** Override the built-in command and option name. */
    name?: string
    /** Override the built-in command and option aliases. */
    alias?: string | string[]
    /** Disable the built-in command entry. */
    disableCommand?: boolean
    /** Disable the built-in global option entry. */
    disableOption?: boolean
}

interface BuiltinOptionConfig {
    /** Override the built-in option name. */
    name?: string
    /** Override the built-in option aliases. */
    alias?: string | string[]
    /** Disable the built-in global option entry. */
    disableOption?: boolean
}

export class Command<
    Opts extends readonly Option[] = [],
    Flags extends readonly Flag[] = [],
    As extends readonly Argument[] = [],
    Cs extends CommandChildren = [],
    Executable extends boolean = false,
> {
    private readonly _name: string
    private _alias?: string | string[]
    private _description?: string
    private _longDescription?: string
    private _options?: Option[]
    private _positonals?: Argument[]
    private _subCommands?: AnyCmd[]
    protected _handler?: ExecuteHandler<Opts, Flags, As>

    constructor(name: string) {
        this._name = name
    }

    get name(): string {
        return this._name
    }

    get alias(): string | string[] | undefined {
        return this._alias
    }

    get description(): string | undefined {
        return this._description
    }

    get longDescription(): string | undefined {
        return this._longDescription
    }

    get options(): Option[] | undefined {
        return this._options
    }

    get positonals(): Argument[] | undefined {
        return this._positonals
    }

    get subCommands(): AnyCmd[] | undefined {
        return this._subCommands
    }

    get handler(): ExecuteHandler<Opts, Flags, As> | undefined {
        return this._handler
    }

    protected setLongDescription(longDescription: string): void {
        this._longDescription = longDescription
    }

    /**
     * Sets one or more aliases for this command.
     *
     * @param aliases Alternative names that should resolve to this command.
     * @returns The same fluent command builder with the aliases applied.
     */
    aliases(...aliases: string[]): this {
        this._alias = aliases.length <= 1 ? aliases[0] : aliases
        return this
    }

    /**
     * Sets the short and long descriptions used in generated help output.
     *
     * @param description The one-line description shown in summaries.
     * @param longDescription Additional help text shown in detailed command help.
     * @returns The same fluent command builder with updated descriptions.
     */
    describe(description: string, longDescription?: string): this {
        this._description = description
        if(longDescription !== undefined) {
            this._longDescription = longDescription
        }
        return this
    }

    /**
     * Adds a boolean flag to this command.
     *
     * @param name The CLI flag name without leading dashes.
     * @param config Optional metadata such as aliases and descriptions.
     * @returns A fluent command builder whose inferred option shape includes the new flag.
     */
    flag<const Name extends string, const Config extends FlagConfigInput | undefined = undefined>(
        name: Name,
        config?: Config,
    ): Command<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable> {
        ;(this._options ??= []).push({name, ...(config ?? {}), valueNotRequired: true, type: OptType.BOOL})
        return this as unknown as Command<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable>
    }

    /**
     * Adds an option that accepts a value to this command.
     *
     * @param name The CLI option name without leading dashes.
     * @param config Optional metadata such as aliases, descriptions, and coercion rules.
     * @returns A fluent command builder whose inferred option shape includes the new option.
     */
    opt<const Name extends string, const Config extends OptionConfigInput | undefined = undefined>(
        name: Name,
        config?: Config,
    ): Command<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable> {
        ;(this._options ??= []).push({name, ...(config ?? {})})
        return this as unknown as Command<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable>
    }

    /**
     * Adds a positional argument to this command.
     *
     * @param name The positional argument name used in help output and inferred opts.
     * @param config Optional metadata such as coercion and requiredness.
     * @returns A fluent command builder whose inferred positional tuple includes the new argument.
     */
    arg<const Name extends string, const Config extends ArgumentConfigInput | undefined = undefined>(
        name: Name,
        config?: Config,
    ): Command<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable> {
        ;(this._positonals ??= []).push({name, ...(config ?? {})})
        return this as unknown as Command<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable>
    }

    /**
     * Adds a nested sub-command to this command.
     *
     * @param subCommand The child command to register.
     * @returns A fluent command builder that is now treated as a branch command.
     */
    command(
        this: Command<Opts, Flags, As, Cs, false>,
        subCommand: AnyCmd | Command<any, any, any, any, any>,
    ): Command<Opts, Flags, As, CommandChildren, false> {
        ;(this._subCommands ??= []).push(subCommand as AnyCmd)
        return this as unknown as Command<Opts, Flags, As, CommandChildren, false>
    }

    /**
     * Marks this command as executable and registers the handler invoked after parsing.
     *
     * @param handler The function that receives parsed option values, including positional arguments by name, and the current [`ExecutionContext`]{@link ExecutionContext}.
     * @returns A fluent command builder that is now treated as executable.
     */
    run(
        this: Command<Opts, Flags, As, [], false>,
        handler: RunHandler<Opts, Flags, As>,
    ): Command<Opts, Flags, As, [], true> {
        this._handler = function(opts: OptsOf<Opts, Flags, As>, context: ExecutionContext) {
            return handler(opts, context)
        }
        return this as unknown as Command<Opts, Flags, As, [], true>
    }
}

export class App<
    Opts extends readonly Option[] = [],
    Flags extends readonly Flag[] = [],
    As extends readonly Argument[] = [],
    Cs extends CommandChildren = [],
    Executable extends boolean = false,
> extends Command<Opts, Flags, As, Cs, Executable> {
    /** @internal */
    _bin?: string
    /** @internal */
    _version?: string
    /** @internal */
    _author?: string
    /** @internal */
    _globalOptions?: Option[]
    /** @internal */
    _helpConfig?: BuiltinEntryConfig
    /** @internal */
    _versionConfig?: BuiltinEntryConfig
    /** @internal */
    _colorConfig?: BuiltinOptionConfig

    /**
     * Applies metadata to the root app in one call.
     *
     * @param config Metadata for the app, including version, author, argv0, and descriptions.
     * @returns The same fluent app builder with the metadata applied.
     */
    meta(config: AppMetaConfig): this {
        if(config.bin !== undefined) {
            this.bin(config.bin)
        }
        if(config.version !== undefined) {
            this.version(config.version)
        }
        if(config.author !== undefined) {
            this.author(config.author)
        }
        if(config.description !== undefined) {
            this.describe(config.description, config.longDescription)
        } else if(config.longDescription !== undefined) {
            this.setLongDescription(config.longDescription)
        }

        return this
    }

    /**
     * Sets the program name shown in help and generated messages.
     *
     * @param binaryName The display name for the CLI binary.
     * @returns The same fluent app builder with the updated program name.
     */
    bin(binaryName: string): this {
        this._bin = binaryName
        return this
    }

    /**
     * Sets the application version surfaced by the built-in version command and option.
     *
     * @param version The version string to display.
     * @returns The same fluent app builder with the version text applied.
     */
    version(version: string): this
    /**
     * Configures the built-in version command and global option.
     *
     * @param config Built-in version settings such as the displayed name, aliases, and whether the command or option should be disabled.
     * @returns The same fluent app builder with the version command and option configuration applied.
     */
    version(config: BuiltinEntryConfig): this
    version(versionOrConfig: string | BuiltinEntryConfig): this {
        if(typeof versionOrConfig === 'string') {
            this._version = versionOrConfig
            return this
        }
        this._versionConfig = {
            ...(this._versionConfig ?? {}),
            ...versionOrConfig,
        }
        return this
    }

    /**
     * Configures the built-in help command and global option.
     *
     * @param config Built-in help settings such as the displayed name, aliases, and whether the command or option should be disabled.
     * @returns The same fluent app builder with the help command and option configuration applied.
     */
    help(config: BuiltinEntryConfig): this {
        this._helpConfig = {
            ...(this._helpConfig ?? {}),
            ...config,
        }
        return this
    }

    /**
     * Configures the built-in color global option.
     *
     * @param config Built-in color option settings such as the displayed name, aliases, and whether the option should be disabled.
     * @returns The same fluent app builder with the color option configuration applied.
     */
    color(config: BuiltinOptionConfig): this {
        this._colorConfig = {
            ...(this._colorConfig ?? {}),
            ...config,
        }
        return this
    }

    /**
     * Sets the application author surfaced by root help output.
     *
     * @param author The author string to display in app help.
     * @returns The same fluent app builder with the author applied.
     */
    author(author: string): this {
        this._author = author
        return this
    }

    /**
     * Adds one or more aliases for the root command while preserving the `App` builder type.
     *
     * @param aliases Alternative names that should resolve to the root app.
     * @returns The same fluent app builder with the aliases applied.
     */
    override aliases(...aliases: string[]): this {
        return super.aliases(...aliases)
    }

    /**
     * Sets the short and long descriptions used in generated help output while preserving the `App` builder type.
     *
     * @param description The one-line description shown in summaries.
     * @param longDescription Additional help text shown in detailed help.
     * @returns The same fluent app builder with updated descriptions.
     */
    override describe(description: string, longDescription?: string): this {
        return super.describe(description, longDescription)
    }

    /**
     * Adds a boolean flag to the root app while preserving the `App` builder type.
     *
     * @param name The CLI flag name without leading dashes.
     * @param config Optional metadata such as aliases and descriptions.
     * @returns A fluent app builder whose inferred option shape includes the new flag.
     */
    override flag<const Name extends string, const Config extends FlagConfigInput | undefined = undefined>(
        name: Name,
        config?: Config,
    ): App<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable> {
        return super.flag(name, config) as unknown as App<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable>
    }

    /**
     * Adds a valued option to the root app while preserving the `App` builder type.
     *
     * @param name The CLI option name without leading dashes.
     * @param config Optional metadata such as aliases, descriptions, and coercion rules.
     * @returns A fluent app builder whose inferred option shape includes the new option.
     */
    override opt<const Name extends string, const Config extends OptionConfigInput | undefined = undefined>(
        name: Name,
        config?: Config,
    ): App<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable> {
        return super.opt(name, config) as unknown as App<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable>
    }

    /**
     * Adds a valued option that is available to the root app and every sub-command.
     *
     * @param name The CLI option name without leading dashes.
     * @param config Optional metadata such as aliases, descriptions, and coercion rules.
     * @returns A fluent app builder whose global option shape includes the new option.
     */
    globalOpt<const Name extends string, const Config extends OptionConfigInput | undefined = undefined>(
        name: Name,
        config?: Config,
    ): this {
        ;(this._globalOptions ??= []).push({name, ...(config ?? {})})
        return this
    }

    /**
     * Adds a positional argument to the root app while preserving the `App` builder type.
     *
     * @param name The positional argument name used in help output and inferred opts.
     * @param config Optional metadata such as coercion and requiredness.
     * @returns A fluent app builder whose inferred positional tuple includes the new argument.
     */
    override arg<const Name extends string, const Config extends ArgumentConfigInput | undefined = undefined>(
        name: Name,
        config?: Config,
    ): App<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable> {
        return super.arg(name, config) as unknown as App<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable>
    }

    /**
     * Adds a nested sub-command to the root app while preserving the `App` builder type.
     *
     * @param subCommand The child command to register.
     * @returns A fluent app builder that is now treated as a branch app.
     */
    override command(
        this: App<Opts, Flags, As, Cs, false>,
        subCommand: AnyCmd | Command<any, any, any, any, any>,
    ): App<Opts, Flags, As, CommandChildren, false> {
        return super.command(subCommand) as unknown as App<Opts, Flags, As, CommandChildren, false>
    }

    /**
     * Marks the root app as executable by registering the handler invoked after parsing.
     *
     * @param handler The function that receives parsed option values including custom global options and positional arguments by name, and the current [`ExecutionContext`]{@link ExecutionContext}.
     * @returns A fluent app builder that is now treated as executable.
     */
    override run(
        this: App<Opts, Flags, As, [], false>,
        handler: RunHandler<Opts, Flags, As>,
    ): App<Opts, Flags, As, [], true> {
        return super.run(handler) as unknown as App<Opts, Flags, As, [], true>
    }

    /**
     * Parses CLI arguments and executes the matching root command or sub-command.
     *
     * @param args The raw CLI arguments to parse. Defaults to `process.argv.slice(2)`.
     * @returns The numeric exit code returned by the resolved command handler, or `0` when the handler does not return one.
     */
    async execute(args: string[] = process.argv.slice(2)): Promise<number> {
        const {executeApp} = await import('./run')
        const code = await executeApp(this, args)
        process.exitCode = code
        return code
    }
}

/**
 * Checks whether a command or app contains nested sub-commands.
 *
 * @param value The command or app to inspect.
 * @returns `true` when the value has sub-commands.
 */
export function hasSubCommands(value: {subCommands?: readonly AnyCmd[] | undefined}): value is {subCommands: readonly AnyCmd[]} {
    return Array.isArray((value as any).subCommands)
}

/**
 * Checks whether a command or app can be executed directly.
 *
 * @param value The command or app to inspect.
 * @returns `true` when the value has an executable handler.
 */
export function isExecutable(value: {execute?: unknown, handler?: unknown}): value is AnyLeafCommand | AnyApp {
    return typeof (value as any).handler === 'function' || Object.prototype.hasOwnProperty.call(value, 'execute')
}

/**
 * Resolves the executable handler for an object-style or fluent command/app.
 *
 * @param value The command or app to inspect.
 * @returns The handler function when one exists, otherwise `undefined`.
 */
export function getExecuteHandler(value: {execute?: unknown, handler?: unknown}): AnyLeafCommand['execute'] | undefined {
    if(typeof (value as any).handler === 'function') {
        return (value as any).handler as AnyLeafCommand['execute']
    }

    if(Object.prototype.hasOwnProperty.call(value, 'execute')) {
        return (value as any).execute as AnyLeafCommand['execute']
    }

    return undefined
}
