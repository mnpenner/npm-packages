// union -> intersection
type U2I<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

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
type ValueOfOption<O extends Option> =
    O['repeatable'] extends true
        ? PrimitiveOfOptType<O['type']>[]
        : PrimitiveOfOptType<O['type']>

type OptionPropMap<I extends Option> = { [K in KeyOfItem<I>]: ValueOfOption<I> }
type FlagPropMap<F extends Flag> = { [K in KeyOfItem<F>]: boolean }

type MergeOptionProps<IU extends Option> = U2I<IU extends any ? OptionPropMap<IU> : never>
type MergeFlagProps<FU extends Flag> = U2I<FU extends any ? FlagPropMap<FU> : never>

// only Options can be "required"
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

// ----- arguments (never boolean) -----
type ValueOfArg<A extends Argument> =
    A['repeatable'] extends true
        ? PrimitiveOfOptType<A['type']>[]
        : PrimitiveOfOptType<A['type']>

type _ArgsFixed<As extends readonly Argument[], Acc extends unknown[] = []> =
    As extends readonly [infer A, ...infer R]
        ? A extends Argument
            ? A['repeatable'] extends true ? Acc
                : _ArgsFixed<R & readonly Argument[], [...Acc, ValueOfArg<A>]>
            : Acc
        : Acc

type _ArgsTailRepeat<As extends readonly Argument[]> =
    As extends readonly [...infer _, infer L]
        ? L extends Argument ? (L['repeatable'] extends true ? PrimitiveOfOptType<L['type']> : never) : never
        : never

export type ArgsOf<As extends readonly Argument[] | undefined> =
    As extends readonly Argument[]
        ? _ArgsTailRepeat<As> extends never
            ? _ArgsFixed<As>
            : [..._ArgsFixed<As>, ..._ArgsTailRepeat<As>[]]
        : unknown[]

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

export type AnyOptType = OptType | string[]

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

/** Boolean flag. */
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

export type CommandChildren = readonly Command<any, any, any, any>[]

type LeafFields<
    Opts extends readonly Option[] | undefined,
    Flags extends readonly Flag[] | undefined,
    As extends readonly Argument[] | undefined
> = {
    options?: Opts
    flags?: Flags
    arguments?: As
    execute(this: AnyApp, options: OptionsOf<Opts, Flags>, args: ArgsOf<As>): MaybePromise<number | void>
    subCommands?: never
}

type BranchFields<Cs extends CommandChildren> = {
    subCommands: Cs
    options?: never
    flags?: never
    arguments?: never
    execute?: never
}

export type LeafCommand<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
> = CommandBase & LeafFields<Opts, Flags, As>

export type BranchCommand<
    Cs extends CommandChildren = CommandChildren,
> = CommandBase & BranchFields<Cs>

export type Command<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
    Cs extends CommandChildren = CommandChildren,
> = LeafCommand<Opts, Flags, As> | BranchCommand<Cs>

type AppBase = CommandBase & {
    argv0?: string
    version?: string
    globalOptions?: Option[]
}

export type LeafApp<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
> = AppBase & LeafFields<Opts, Flags, As>

export type BranchApp<
    Cs extends CommandChildren = CommandChildren,
> = AppBase & BranchFields<Cs>

export type App<
    Opts extends readonly Option[] | undefined = undefined,
    Flags extends readonly Flag[] | undefined = undefined,
    As extends readonly Argument[] | undefined = undefined,
    Cs extends CommandChildren = CommandChildren,
> = LeafApp<Opts, Flags, As> | BranchApp<Cs>

export type AnyLeafCommand = LeafCommand<any, any, any>
export type AnyBranchCommand = BranchCommand<CommandChildren>
export type AnyCmd = Command<any, any, any, any>
export type AnyLeafApp = LeafApp<any, any, any>
export type AnyBranchApp = BranchApp<CommandChildren>
export type AnyApp = App<any, any, any, any>

export function hasSubCommands(value: AnyCmd | AnyApp): value is AnyBranchCommand | AnyBranchApp {
    return 'subCommands' in value
}

export function isExecutable(value: AnyCmd | AnyApp): value is AnyLeafCommand | AnyLeafApp {
    return 'execute' in value
}

export function defineCommand<
    const Opts extends readonly Option[] | undefined,
    const Flags extends readonly Flag[] | undefined,
    const As extends readonly Argument[] | undefined,
>(c: LeafCommand<Opts, Flags, As>): LeafCommand<Opts, Flags, As>
export function defineCommand<
    const Cs extends CommandChildren,
>(c: BranchCommand<Cs>): BranchCommand<Cs>
export function defineCommand(c: AnyCmd): AnyCmd {
    return c
}

export function defineApp<
    const Opts extends readonly Option[] | undefined,
    const Flags extends readonly Flag[] | undefined,
    const As extends readonly Argument[] | undefined,
>(app: LeafApp<Opts, Flags, As>): LeafApp<Opts, Flags, As>
export function defineApp<
    const Cs extends CommandChildren,
>(app: BranchApp<Cs>): BranchApp<Cs>
export function defineApp(app: AnyApp): AnyApp {
    return app
}
