import type {ContextMiddleware} from '../types'


export const startTimeCtx = (): ContextMiddleware<{startTime: number}> => ctx => {
    ctx.startTime = Date.now()
}
