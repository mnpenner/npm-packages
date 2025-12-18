import type {AnyContext, RequestContext} from './run-handler-types'
import {runChain} from './run-chain/run-chain'
import type {RunChain} from './run-chain/run-chain-types'


/**
 * Invokes a chain of middleware functions using the Web API Response object.
 * Allows middleware to pass arbitrary values between each other, but requires
 * that the *final* result of the entire chain resolves to a standard Response object.
 *
 * @param input The initial input/context object.
 * @param middleware An array of middleware functions.
 * @returns A Promise that resolves with the Response object produced by the chain.
 * @throws Error if the chain completes without the final result being a Response,
 *         or if next() is misused (called at end of chain, called multiple times).
 */
export async function runHandler<Ctx extends object = AnyContext>(
    input: RequestContext<Ctx>,
    middleware: RunChain<RequestContext<Ctx>,Response>
): Promise<Response> {
    const finalResult = await runChain(input, middleware)

    if(!(finalResult instanceof Response)) {
        const resultType = finalResult === null ? 'null' : typeof finalResult
        throw new Error(`Middleware chain completed without returning a Response. Final value was of type: ${resultType}`)
    }

    return finalResult
}
