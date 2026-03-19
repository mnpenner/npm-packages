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

type ValueOfOption<O extends Option> =
    O extends { repeatable: true }
        ? PrimitiveOfOptType<TypeOfItem<O>>[]
        : PrimitiveOfOptType<TypeOfItem<O>>

type OptionPropMap<I extends Option> = { [K in KeyOfItem<I>]: ValueOfOption<I> }
type FlagPropMap<F extends Flag> = { [K in KeyOfItem<F>]: boolean }

type MergeOptionProps<IU extends Option> = U2I<IU extends any ? OptionPropMap<IU> : never>
type MergeFlagProps<FU extends Flag> = U2I<FU extends any ? FlagPropMap<FU> : never>

type RequiredOptions<I extends Option> = Extract<I, { required: true }>
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
    A extends { repeatable: true }
        ? PrimitiveOfOptType<TypeOfItem<A>>[]
        : PrimitiveOfOptType<TypeOfItem<A>>

type _ArgsFixed<As extends readonly Argument[], Acc extends unknown[] = []> =
    As extends readonly [infer A, ...infer R]
        ? A extends Argument
            ? A['repeatable'] extends true ? Acc
                : _ArgsFixed<R & readonly Argument[], [...Acc, ValueOfArg<A>]>
            : Acc
        : Acc

type _ArgsTailRepeat<As extends readonly Argument[]> =
    As extends readonly [...infer _, infer L]
        ? L extends Argument ? (L extends { repeatable: true } ? PrimitiveOfOptType<TypeOfItem<L>> : never) : never
        : never

type ArgumentPropMap<I extends Argument> = { [K in KeyOfItem<I>]: ValueOfArg<I> }
type MergeArgumentProps<IU extends Argument> = U2I<IU extends any ? ArgumentPropMap<IU> : never>
type RequiredArguments<I extends Argument> = Extract<I, { required: true }>
type OptionalArguments<I extends Argument> = Exclude<I, RequiredArguments<I>>

export type ArgsOf<As extends readonly Argument[] | undefined> =
    As extends readonly Argument[]
        ? _ArgsTailRepeat<As> extends never
            ? _ArgsFixed<As>
            : [..._ArgsFixed<As>, ..._ArgsTailRepeat<As>[]]
        : unknown[]

export type KwargsOf<
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
    /** Property name to use in `execute()` options. */
    key?: string
}

export type AnyOptType = OptType | readonly string[]

export interface ArgumentOrOption extends ArgumentOrOptionOrFlag {
    /** Type to coerce the option value to. */
    type?: AnyOptType
    /** Option is repeatable by specifying the flag again. Value will be an array. */
    repeatable?: boolean
    /** Option is required. */
    required?: boolean
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
}

/** Option with value. */
export interface Option extends ArgumentOrOption, OptionOrFlag {
    /** Placeholder value to use in help. */
    valuePlaceholder?: string
    /** Caller may specify a value (--opt=value), but it's not required (will negate `defaultValue` instead). */
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

export type LeafCommand<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
> = LeafCommandInput<Opts, Flags, As>

export type BranchCommand<
    Cs extends CommandChildren = CommandChildren,
> = BranchCommandInput<Cs>

export type Command<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
    Cs extends CommandChildren = CommandChildren,
> = LeafCommand<Opts, Flags, As> | BranchCommand<Cs>

export type CommandChildren = readonly Command<any, any, any, any>[]

export interface ExecutableInput<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> {
    options?: Opts
    flags?: Flags
    positonals?: As
    execute(this: AnyApp, kwargs: KwargsOf<Opts, Flags, As>, args: ArgsOf<As>): MaybePromise<number | void>
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

export type App<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
    Cs extends CommandChildren = CommandChildren,
> = LeafApp<Opts, Flags, As> | BranchApp<Cs>

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
    execute(this: AnyApp, kwargs: Record<string, any>, args: any[]): MaybePromise<number | void>
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

export interface AnyLeafApp extends AppBase {
    options?: readonly Option[] | undefined
    flags?: readonly Flag[] | undefined
    positonals?: readonly Argument[] | undefined
    execute(this: AnyApp, kwargs: Record<string, any>, args: any[]): MaybePromise<number | void>
    subCommands?: never | undefined
}

export interface AnyBranchApp extends AppBase {
    subCommands: readonly AnyCmd[]
    options?: never | undefined
    flags?: never | undefined
    positonals?: never | undefined
    execute?: never | undefined
}

export type AnyApp = AnyLeafApp | AnyBranchApp

type FluentFlagConfig = Omit<Flag, 'name' | 'key' | 'valueNotRequired'> & { key?: string }
type FluentOptionConfig = Omit<Option, 'name' | 'key'> & { key?: string }
type FluentArgumentConfig = Omit<Argument, 'name' | 'key'> & { key?: string }

type BuildFlag<Name extends string, Config extends FluentFlagConfig | undefined> = Flatten<
    { name: Name } &
    (Config extends undefined ? {} : Config)
>

type BuildOption<Name extends string, Config extends FluentOptionConfig | undefined> = Flatten<
    { name: Name } &
    (Config extends undefined ? {} : Config)
>

type BuildArgument<Name extends string, Config extends FluentArgumentConfig | undefined> = Flatten<
    { name: Name } &
    (Config extends undefined ? {} : Config)
>

export type RunHandler<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> = (args: ArgsOf<As>, kwargs: KwargsOf<Opts, Flags, As>) => MaybePromise<number | void>

type FluentExecuteHandler<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined,
> = ExecutableInput<Opts, Flags, As>['execute']

type AppMetaConfig = {
    argv0?: string
    version?: string
    description?: string
    longDescription?: string
}

class FluentCommand<
    Opts extends readonly Option[] = [],
    Flags extends readonly Flag[] = [],
    As extends readonly Argument[] = [],
    Cs extends CommandChildren = [],
    Executable extends boolean = false,
> {
    readonly name: string
    alias?: string | string[]
    description?: string
    longDescription?: string
    options?: Option[]
    flags?: Flag[]
    positonals?: Argument[]
    subCommands?: AnyCmd[]
    handler?: FluentExecuteHandler<Opts, Flags, As>

    constructor(name: string) {
        this.name = name
    }

    /**
     * Sets one or more aliases for this command.
     *
     * @param aliases Alternative names that should resolve to this command.
     * @returns The same fluent command builder with the aliases applied.
     */
    aliases(...aliases: string[]): this {
        this.alias = aliases.length <= 1 ? aliases[0] : aliases
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
        this.description = description
        if(longDescription !== undefined) {
            this.longDescription = longDescription
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
    flag<const Name extends string, const Config extends FluentFlagConfig | undefined = undefined>(
        name: Name,
        config?: Config,
    ): FluentCommand<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable> {
        ;(this.flags ??= []).push({name, ...(config ?? {}), valueNotRequired: true})
        return this as unknown as FluentCommand<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable>
    }

    /**
     * Adds an option that accepts a value to this command.
     *
     * @param name The CLI option name without leading dashes.
     * @param config Optional metadata such as aliases, descriptions, and coercion rules.
     * @returns A fluent command builder whose inferred option shape includes the new option.
     */
    opt<const Name extends string, const Config extends FluentOptionConfig | undefined = undefined>(
        name: Name,
        config?: Config,
    ): FluentCommand<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable> {
        ;(this.options ??= []).push({name, ...(config ?? {})})
        return this as unknown as FluentCommand<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable>
    }

    /**
     * Adds a positional argument to this command.
     *
     * @param name The positional argument name used in help output and inferred kwargs.
     * @param config Optional metadata such as coercion and requiredness.
     * @returns A fluent command builder whose inferred positional tuple includes the new argument.
     */
    arg<const Name extends string, const Config extends FluentArgumentConfig | undefined = undefined>(
        name: Name,
        config?: Config,
    ): FluentCommand<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable> {
        ;(this.positonals ??= []).push({name, ...(config ?? {})})
        return this as unknown as FluentCommand<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable>
    }

    /**
     * Adds a nested sub-command to this command.
     *
     * @param subCommand The child command to register.
     * @returns A fluent command builder that is now treated as a branch command.
     */
    command(
        this: FluentCommand<Opts, Flags, As, Cs, false>,
        subCommand: AnyCmd | FluentCommand<any, any, any, any, any>,
    ): FluentCommand<Opts, Flags, As, CommandChildren, false> {
        ;(this.subCommands ??= []).push(subCommand as AnyCmd)
        return this as unknown as FluentCommand<Opts, Flags, As, CommandChildren, false>
    }

    /**
     * Marks this command as executable and registers the handler invoked after parsing.
     *
     * @param handler The function that receives parsed positional arguments and keyword arguments.
     * @returns A fluent command builder that is now treated as executable.
     */
    run(
        this: FluentCommand<Opts, Flags, As, [], false>,
        handler: RunHandler<Opts, Flags, As>,
    ): FluentCommand<Opts, Flags, As, [], true> {
        this.handler = function(this: AnyApp, kwargs: KwargsOf<Opts, Flags, As>, args: ArgsOf<As>) {
            return handler(args, kwargs)
        }
        return this as unknown as FluentCommand<Opts, Flags, As, [], true>
    }
}

class FluentApp<
    Opts extends readonly Option[] = [],
    Flags extends readonly Flag[] = [],
    As extends readonly Argument[] = [],
    Cs extends CommandChildren = [],
    Executable extends boolean = false,
> extends FluentCommand<Opts, Flags, As, Cs, Executable> {
    _argv0?: string
    _version?: string
    globalOptions?: Option[]

    /**
     * Applies metadata to the root app in one call.
     *
     * @param config Metadata for the app, including version, argv0, and descriptions.
     * @returns The same fluent app builder with the metadata applied.
     */
    meta(config: AppMetaConfig): this {
        if(config.argv0 !== undefined) {
            this.argv0(config.argv0)
        }
        if(config.version !== undefined) {
            this.version(config.version)
        }
        if(config.description !== undefined) {
            this.describe(config.description, config.longDescription)
        } else if(config.longDescription !== undefined) {
            this.longDescription = config.longDescription
        }

        return this
    }

    /**
     * Sets the program name shown in help and generated messages.
     *
     * @param argv0 The display name for the CLI binary.
     * @returns The same fluent app builder with the updated program name.
     */
    argv0(argv0: string): this {
        this._argv0 = argv0
        return this
    }

    /**
     * Sets the application version surfaced by the built-in version command.
     *
     * @param version The version string to display.
     * @returns The same fluent app builder with the version applied.
     */
    version(version: string): this {
        this._version = version
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
    override flag<const Name extends string, const Config extends FluentFlagConfig | undefined = undefined>(
        name: Name,
        config?: Config,
    ): FluentApp<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable> {
        return super.flag(name, config) as unknown as FluentApp<Opts, [...Flags, BuildFlag<Name, Config>], As, Cs, Executable>
    }

    /**
     * Adds a valued option to the root app while preserving the `App` builder type.
     *
     * @param name The CLI option name without leading dashes.
     * @param config Optional metadata such as aliases, descriptions, and coercion rules.
     * @returns A fluent app builder whose inferred option shape includes the new option.
     */
    override opt<const Name extends string, const Config extends FluentOptionConfig | undefined = undefined>(
        name: Name,
        config?: Config,
    ): FluentApp<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable> {
        return super.opt(name, config) as unknown as FluentApp<[...Opts, BuildOption<Name, Config>], Flags, As, Cs, Executable>
    }

    /**
     * Adds a positional argument to the root app while preserving the `App` builder type.
     *
     * @param name The positional argument name used in help output and inferred kwargs.
     * @param config Optional metadata such as coercion and requiredness.
     * @returns A fluent app builder whose inferred positional tuple includes the new argument.
     */
    override arg<const Name extends string, const Config extends FluentArgumentConfig | undefined = undefined>(
        name: Name,
        config?: Config,
    ): FluentApp<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable> {
        return super.arg(name, config) as unknown as FluentApp<Opts, Flags, [...As, BuildArgument<Name, Config>], Cs, Executable>
    }

    /**
     * Adds a nested sub-command to the root app while preserving the `App` builder type.
     *
     * @param subCommand The child command to register.
     * @returns A fluent app builder that is now treated as a branch app.
     */
    override command(
        this: FluentApp<Opts, Flags, As, Cs, false>,
        subCommand: AnyCmd | FluentCommand<any, any, any, any, any>,
    ): FluentApp<Opts, Flags, As, CommandChildren, false> {
        return super.command(subCommand) as unknown as FluentApp<Opts, Flags, As, CommandChildren, false>
    }

    /**
     * Marks the root app as executable by registering the handler invoked after parsing.
     *
     * @param handler The function that receives parsed positional arguments and keyword arguments.
     * @returns A fluent app builder that is now treated as executable.
     */
    override run(
        this: FluentApp<Opts, Flags, As, [], false>,
        handler: RunHandler<Opts, Flags, As>,
    ): FluentApp<Opts, Flags, As, [], true> {
        return super.run(handler) as unknown as FluentApp<Opts, Flags, As, [], true>
    }

    /**
     * Parses CLI arguments and executes the matching root command or sub-command.
     *
     * @param args The raw CLI arguments to parse. Defaults to `process.argv.slice(2)`.
     * @returns The numeric exit code returned by the resolved command handler.
     */
    async execute(args: string[] = process.argv.slice(2)): Promise<number> {
        const {executeApp} = await import('./run')
        return executeApp(this as unknown as AnyApp, args)
    }
}

export const Command: new (name: string) => FluentCommand<[], [], [], [], false> = FluentCommand
export const App: new (name: string) => FluentApp<[], [], [], [], false> = FluentApp

/**
 * Checks whether a command or app contains nested sub-commands.
 *
 * @param value The command or app to inspect.
 * @returns `true` when the value has sub-commands.
 */
export function hasSubCommands(value: AnyCmd | AnyApp): value is AnyBranchCommand | AnyBranchApp {
    return Array.isArray((value as any).subCommands)
}

/**
 * Checks whether a command or app can be executed directly.
 *
 * @param value The command or app to inspect.
 * @returns `true` when the value has an executable handler.
 */
export function isExecutable(value: AnyCmd | AnyApp): value is AnyLeafCommand | AnyLeafApp {
    return typeof (value as any).handler === 'function' || Object.prototype.hasOwnProperty.call(value, 'execute')
}

/**
 * Resolves the executable handler for an object-style or fluent command/app.
 *
 * @param value The command or app to inspect.
 * @returns The handler function when one exists, otherwise `undefined`.
 */
export function getExecuteHandler(value: AnyCmd | AnyApp): AnyLeafCommand['execute'] | undefined {
    if(typeof (value as any).handler === 'function') {
        return (value as any).handler as AnyLeafCommand['execute']
    }

    if(Object.prototype.hasOwnProperty.call(value, 'execute')) {
        return (value as any).execute as AnyLeafCommand['execute']
    }

    return undefined
}

/**
 * Resolves the configured `argv0` value for an app.
 *
 * @param app The app to inspect.
 * @returns The configured display name, if any.
 */
export function getAppArgv0(app: AnyApp): string | undefined {
    return app instanceof FluentApp ? app._argv0 : undefined
}

/**
 * Resolves the configured version value for an app.
 *
 * @param app The app to inspect.
 * @returns The configured version string, if any.
 */
export function getAppVersion(app: AnyApp): string | undefined {
    return app instanceof FluentApp ? app._version : undefined
}
