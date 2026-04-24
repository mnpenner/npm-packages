import type {MaybePromise} from '#shared/types/util-types'

export type NextFn<In = any, Out = any> = (ctx?: In) => Promise<Out>;
/**
 * A function that can be passed into a runChain() array.
 */
export type ChainableFn<In = any, NextIn = In, NextOut = NextIn, Out = NextOut> = (
    ctx: In,
    next: NextFn<NextIn, NextOut>
) => MaybePromise<Out>;
/**
 * Function that transforms input before passing it to next().
 * Output of next() is returned.
 */
export type TransformInputFn<In, NextIn = In> = ChainableFn<In, NextIn, any, any>;
export type TransformInputImplicitReturnFn<In, NextIn = In> = ChainableFn<In, NextIn, any, void>;
/**
 * Function that transforms return value from next().
 */
export type TransformOutputFn<NextOut, Out = NextOut> = ChainableFn<any, any, NextOut, Out>
/**
 * Function has some external effect.
 * The return value from next() is implicitly returned.
 */
export type SideEffect<In> = ChainableFn<In, any, any, void>
/**
 * Function that merges extra data into the context.
 */
export type AddContext<Ctx extends object, In extends object = any> = ChainableFn<In & Partial<Ctx>, In & Ctx, any, any>

// export type TerminalFn<In=any,Out=any> = ChainableFn<In,never,never,Out>
export type TerminalFn<In = any, Out = any> = (
    ctx: In,
) => MaybePromise<Out>;
export type RunChain<In = any, FinalOut = any> =
    | [ChainableFn<In, any, any, any>, ...ChainableFn<any, any, any, any>[], TerminalFn<any, FinalOut>]
    // | [TransformOutputFn<In,FinalOut>, ...TransformInputFn<any,any>[], TerminalFn<any,any>]
    // | [TransformInputImplicitReturnFn<In,any>, ...TransformInputFn<any,any>[], TerminalFn<any,FinalOut>]
    // | [TransformOutputFn<any,FinalOut>, ...ChainableFn<any,any,any,any>[]]
    | [ChainableFn<In, any, any, any>, ...ChainableFn<any, any, any, any>[]]
    | [TerminalFn<In, FinalOut>]
    | []

export type StrictRunChain<In = any, Out = any> =
    | [TerminalFn<In, Out>]
    | [TransformOutputFn<In, any>, ...TransformOutputFn<any, any>[], TerminalFn<any, Out>]
