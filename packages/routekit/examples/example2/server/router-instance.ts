#!/usr/bin/env -S bun --hot --no-clear-screen
import { Router, text } from '@mpen/routekit'
import { loggerCtx, requestIdCtx } from '@mpen/routekit/middleware'

const router = new Router()
    .use(requestIdCtx())
    .use(loggerCtx())

    .methodNotAllowed(() => text('method not allowed'))
    .notAcceptable(() => text('not acceptable'))
    .notFound(() => text('not found'))
    .internalError(() => text('internal error'))

    .get('/ping', () => text('pong'))

    .get('/', (ctx) => {
        const logger = ctx.logger.withName('root')
        logger.info(Object.fromEntries(ctx.req.headers as any))
        return text('Hello World!')
    })

export default router
