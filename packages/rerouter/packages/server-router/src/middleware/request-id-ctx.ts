import type {AnyContext, ContextMiddleware, OneOrMany} from '../types'
import {toArray} from '@mpen/server-router/lib/collections'

declare global {
    var _requestCounter: number
}

globalThis._requestCounter ??= 0

export interface RequestIdCtxOptions<Ctx extends object = AnyContext> {
    /**
     * Header(s) to check for a Request ID. Defaults to "x-request-id"
     */
    requestIdHeader?: OneOrMany<string>
}

export function requestIdCtx<Ctx extends object = AnyContext>(
    options: RequestIdCtxOptions<Ctx> = {}
): ContextMiddleware<{ requestId: string }> {
    const headers = toArray(options.requestIdHeader ?? 'x-request-id')

    return ctx => {
        let headerId: string | null = null

        for (const name of headers) {
            headerId = ctx.req.headers.get(name)
            if (headerId !== null) break
        }

        ctx.requestId = headerId ?? (++globalThis._requestCounter).toString(36)
    }
}
