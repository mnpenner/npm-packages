#!/usr/bin/env -S bun --hot --no-clear-screen
import {Router} from '../src'
import {plainTextResponse} from '../src/response/simple'
import {requestIdCtx} from '../src/middleware'
import {loggerCtx} from '../src/middleware/logger-context'

const router = new Router()
    .use(requestIdCtx())
    .use(loggerCtx())

    .methodNotAllowed(() => plainTextResponse('method not allowed'))
    .notAcceptable(() => plainTextResponse('not acceptable'))
    .notFound(() => plainTextResponse('not found'))
    .internalError(() => plainTextResponse('internal error'))

    .get('/ping', () => plainTextResponse('pong'))

    .get('/', ctx => {
        ctx.logger.info(ctx.pathParams)
        return plainTextResponse('Hello World!')
    })

export default router
