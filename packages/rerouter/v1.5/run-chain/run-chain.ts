
import type {NextFn, RunChain} from './run-chain-types'

export async function runChain<In, FinalOut>(
    input: In,
    fnChain: RunChain<In, FinalOut>
): Promise<FinalOut> {
    if(!fnChain?.length) {
        return undefined as any
    }

    // const currentMw = fnChain[0]
    // const remainingChain = fnChain.slice(1) as RunChain

    const [currentMw, ...remainingChain] = fnChain

    let nextCalled = false
    let downstreamResult: any = undefined

    const next: NextFn<any, any> = async (nextInput?: any): Promise<any> => {
        if(nextCalled) {
            throw new Error(`next() called more than once in a single middleware`)
        }
        nextCalled = true

        if(!remainingChain.length) {
            throw new Error(`Middleware chain ended, but 'next()' was called. No further middleware to generate a value or Response.`)
        }

        downstreamResult = await runChain(nextInput !== undefined ? nextInput : input, remainingChain as RunChain)
        return downstreamResult
    }

    const mwResult = await currentMw!(input, next)

    if(!nextCalled && mwResult === undefined) {
        // If the middleware didn't return anything and didn't call next(), automatically call next().
        return next()
    }

    // console.log(currentMw,input,mwResult,downstreamResult)

    // If the middleware called next but didn't return anything, use the response from next() instead.
    return mwResult !== undefined ? mwResult : downstreamResult
}
