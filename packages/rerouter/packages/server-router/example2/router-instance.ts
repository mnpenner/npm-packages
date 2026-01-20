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
        ctx.logger.info('hello',{foo:'bar'},234,[4,5,6], new Set([7,8]))
        ctx.logger.warn('warning')
        ctx.logger.error('err0r')
        const sub = ctx.logger.withName('sub')
        sub.debug('sub info')
        sub.withName('sub2').trace('sub info 2')
        return plainTextResponse('Hello World!')
    })

export default router
