import type {Falsy, IsAny, MaybeArray, MaybePromise, Unpromisify} from '#shared/types/util-types'
import type {ChainableFn, RunChain, TerminalFn} from './run-chain/run-chain-types'


export interface AnyContext {
    [key: string]: any
}

type BaseRequestContext = {
    /**
     * The incoming request object.
     */
    readonly request: Request;
    /**
     * Parsed request URL. Same as `new URL(request.url)`.
     */
    readonly url: URL;
    /**
     * Params matched in the path.
     */
    readonly pathParams: Record<string, string>;
};


export type RequestContext<Ctx extends object = AnyContext> =
    IsAny<Ctx> extends true
        ? { __error: "Ctx cannot be <any>. Please provide a specific object type." }
        : BaseRequestContext & Ctx;

// export type RequestContext<Ctx extends object = {}> = {
//     readonly req: Request;
//     readonly params: Record<string, string>;
//     readonly matchedPath: MatchedPath
// };

// TODO: split the Request/Response stuff from the runChain stuff.
export type RequestMethod =
    | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE'
    | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'
    | '*' | string;


// export type Middleware<Ctx extends object = DefaultContext,R=any> = (
//     ctx: RequestContext<Ctx>,
//     next: NextFn<Ctx,any>
// ) => MaybePromise<R>;


export type RequestMiddleware<Ctx extends object = AnyContext> = ChainableFn<RequestContext<Ctx>,any,any,any>

export type RequestHandler<Ctx extends object = AnyContext> = TerminalFn<RequestContext<Ctx>,Response>

// export type RequestHandler<Ctx extends object = DefaultContext> = (
//     ctx: RequestContext<Ctx>,
// ) => MaybePromise<any>;

export type HandlerChain<Ctx extends object = AnyContext> = RunChain<RequestContext<Ctx>,Response>

/**
 * Unnormalized handler input.
 */
// type AnyHandler = Middleware<any> | Array<Middleware<any> | null | undefined | false>
// type AnyHandler = Handler<any> | [...Array<Middleware<any> | null | undefined | false>, Handler<any>]
export type AnyHandler<Ctx extends object = AnyContext> = MaybeArray<RequestMiddleware<Ctx> | Falsy>
export type AnyMiddleware<Ctx extends object = AnyContext> = MaybeArray<RequestMiddleware<Ctx> | Falsy>
// type AnyMiddleware = Middleware<any> | Array<Middleware<any> | null | undefined | false>
/**
 * Normalized handler chain.
 */
// export type HandlerChain<Ctx extends object =DefaultContext> = [...Middleware<Ctx>[], Handler<Ctx>]
export type AnyPathMatchers = MaybeArray<Path>
export type AnyRequestMethods = MaybeArray<RequestMethod>
export type Path = string | RegExp
export type MatchedPath = Path | [prefix: string, path: RegExp]
export type MatchResult<Ctx extends object = AnyContext> = {
    handlers: HandlerChain<Ctx>,
    params: Record<string, string>,
    matchedPath: MatchedPath
};

export type ErrorContext = RequestContext<{error:Error}>

export type ErrorHandler = (ctx: ErrorContext) => MaybePromise<Response>

type NextContext<R> = Extract<Unpromisify<R>, object>;


export type RequestSideEffect<Ctx extends object = AnyContext> = ChainableFn<RequestContext<Ctx>, any, any, void>
