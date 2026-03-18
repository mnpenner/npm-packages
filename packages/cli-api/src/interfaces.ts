// union → intersection
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
type FlagPropMap<F extends Flag>     = { [K in KeyOfItem<F>]: boolean }

type MergeOptionProps<IU extends Option> = U2I<IU extends any ? OptionPropMap<IU> : never>
type MergeFlagProps<FU extends Flag>     = U2I<FU extends any ? FlagPropMap<FU>   : never>

// only Options can be "required"
type RequiredOptions<I extends Option> = Extract<I, { required: true }>
type OptionalOptions<I extends Option> = Exclude<I, RequiredOptions<I>>

export type OptionsOf<
    Opts  extends readonly Option[] | undefined,
    Flags extends readonly Flag[]   | undefined
> =
    (Opts  extends readonly any[] ? (
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
        ? L extends Argument ? (L['repeatable'] extends true ? ValueOfArg<L> : never) : never
        : never

export type ArgsOf<As extends readonly Argument[] | undefined> =
    As extends readonly Argument[]
        ? _ArgsTailRepeat<As> extends never
            ? _ArgsFixed<As>
            : [..._ArgsFixed<As>, ..._ArgsTailRepeat<As>[]]
        : unknown[]

// ---------- Generic Command with inferred execute ----------
export type Command<
    Opts  extends readonly Option[] | undefined  = undefined,
    Flags extends readonly Flag[]   | undefined  = undefined,
    As    extends readonly Argument[] | undefined = undefined
> = {
    name: string
    alias?: string | string[]
    description?: string
    longDescription?: string
    options?: Opts
    flags?: Flags
    arguments?: As
    execute(options: OptionsOf<Opts, Flags>, args: ArgsOf<As>, app: App<any>): MaybePromise<number | void>
}

export type MaybePromise<V> = V | PromiseLike<V>

export function defineCommand<
    const Opts extends readonly Option[] | undefined,
    const Flags extends readonly Flag[] | undefined,
    const As extends readonly Argument[] | undefined
>(c: Command<Opts, Flags, As>): Command<Opts, Flags, As> { return c }

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

export type AnyOptType = OptType | string[] // | ((value:string)=>any)

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

export interface App<Cs extends readonly Command<any, any, any>[] = readonly Command<any, any, any>[]> {
    name: string
    argv0?: string
    version?: string
    commands: Cs
    globalOptions?: Option[]
}

export type AnyCmd = Command<any, any, any>
export type AnyApp = App<readonly AnyCmd[]>
