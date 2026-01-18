import type {ContextMiddleware} from '../types'

declare global {
    var _requestCounter: number | undefined
}

globalThis._requestCounter ??= 0

/**
 * Add an incrementing request id to the router context.
 *
 * @example
 * ```ts
 * const router = new Router().use(addRequestId())
 * router.add({
 *   pattern: '/',
 *   handler: ctx => new Response(String(ctx.requestId)),
 * })
 * ```
 *
 * @returns Middleware that adds `requestId` to the request context.
 */
export const requestIdCtx = (): ContextMiddleware<{requestId: number}> => ctx => {
    ctx.requestId = (globalThis._requestCounter ?? 0) + 1
    globalThis._requestCounter = ctx.requestId
}
