#!/usr/bin/env -S bun --hot --no-clear-screen
import { Router, plainTextResponse } from '../../../src'
import { requestIdCtx } from '../../../src/router/middleware'
import { loggerCtx } from '../../../src/router/middleware/logger-context'

const router = new Router()
    .use(requestIdCtx())
    .use(loggerCtx())

    .methodNotAllowed(() => plainTextResponse('method not allowed'))
    .notAcceptable(() => plainTextResponse('not acceptable'))
    .notFound(() => plainTextResponse('not found'))
    .internalError(() => plainTextResponse('internal error'))

    .get('/ping', () => plainTextResponse('pong'))

    .get('/', (ctx) => {
        const logger = ctx.logger.withName('root')
        logger.info(Object.fromEntries(ctx.req.headers as any))
        return plainTextResponse('Hello World!')
    })

export default router
