import type {ContextMiddleware, MediaType} from '../types'
import {parseAcceptHeader} from '../lib/media-type'

/**
 * Attach parsed Accept header values to the request context.
 *
 * @returns Middleware that adds `accept` to the request context.
 */
export const acceptCtx = (): ContextMiddleware<{accept: MediaType[]}> => ctx => {
    const header = ctx.req.headers.get('accept')
    ctx.accept = parseAcceptHeader(header ?? '*/*')
}
