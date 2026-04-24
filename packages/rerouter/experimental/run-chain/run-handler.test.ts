#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {runHandler} from './run-handler'
import type { AnyContext,
    RequestContext,
    RequestMiddleware
} from './run-handler-types';

function assumeType<T>(_value: unknown): asserts _value is T {}



describe(runHandler.name, () => {
    type TestContext = { data: number, logger?: boolean, handler?: boolean };

    function makeContext<Ctx extends object = AnyContext>(ctx?: Ctx): RequestContext<Ctx> {
        // This is pretty much the same as Router.dispatch
        const request = new Request('https://host/path')
        const url = new URL(request.url)
        ctx ??= Object.create(null)
        assumeType<RequestContext<Ctx>>(ctx)
        return Object.assign(ctx, {
            request,
            url,
            pathParams: {},
        })
    }

    it('empty chain throws', () => {
        expect(runHandler(makeContext(), [] as any))
            .rejects
            .toThrow('Middleware chain completed without returning a Response. Final value was of type: undefined')
    })

    it('chain ending without Response throws', () => {
        const mw1: RequestMiddleware = async (ctx, next) => {
            // Calls next, gets object back from mw2
            await next()
            // mw1 returns void implicitly, so mw2's object should propagate up
        }
        const mw2: RequestMiddleware = (ctx, next) => {
            // Returns non-Response
            return {message: 'finished'}
        }

        expect(runHandler(makeContext(), [mw1, mw2]))
            .rejects
            .toThrow('Middleware chain completed without returning a Response. Final value was of type: object')
    })

    it('chain where last middleware calls next() throws', () => {
        const mw1: RequestMiddleware = async (ctx, next) => {
            // Must await and return result from next()
            return await next()
        }
        const mwLastCallsNext: RequestMiddleware = async (ctx, next) => {
            // Calling next() here will hit the end of the chain
            return await next() // Should throw
        }

        expect(runHandler(makeContext(), [mw1, mwLastCallsNext]))
            .rejects
            .toThrow("Middleware chain ended, but 'next()' was called. No further middleware to generate a value or Response.")
    })


    it('shortcircuit chain (returns Response early)', async () => {
        const shortCircuitMiddleware: RequestMiddleware = (ctx, next): Response => {
            // Immediately return a Response
            return new Response("Short circuit!", {status: 201})
        }
        const neverCalledMiddleware: RequestMiddleware = (ctx, next): Response => {
            // This should not be executed
            throw new Error("Middleware that should have been skipped was called.")
        }

        const ans = await runHandler(makeContext(), [shortCircuitMiddleware, neverCalledMiddleware])

        expect(ans).toBeInstanceOf(Response)
        expect(ans.status).toBe(201)
        expect(await ans.text()).toBe("Short circuit!")
    })

    it('standard chain (ends with Response)', async () => {
        const loggerMiddleware: RequestMiddleware<TestContext> = async (ctx, next) => {
            ctx.logger = true
            await next() // Continue chain, don't return anything explicitly
        }

        const handlerMiddleware: RequestMiddleware<TestContext> = (ctx, next) => {
            ctx.handler = true
            const body = {value: 99, receivedData: ctx.data} // 99 is defined here
            return new Response(JSON.stringify(body), {
                status: 200,
                headers: {'Content-Type': 'application/json'}
            })
        }

        const ctx = makeContext<TestContext>({data: 3})
        const ans = await runHandler(ctx, [loggerMiddleware, handlerMiddleware])

        expect(ans).toBeInstanceOf(Response)
        expect(ans.status).toBe(200)
        expect(ans.headers.get('content-type')).toBe('application/json')
        expect(await ans.json()).toEqual({value: 99, receivedData: 3}) // Assert 99 and data
        expect(ctx.logger).toBe(true) // Check context modification
        expect(ctx.handler).toBe(true) // Check context modification
    })

    it("Allows passing non-Responses up the chain for transformation", async () => {
        // This middleware expects *any* value from next() and converts non-Responses
        const jsonifyMiddleware: RequestMiddleware<TestContext> = async (ctx, next) => {
            const res = await next() // res could be Response or {foo:'bar'}
            if(res instanceof Response) return res
            // Convert plain object to Response
            return new Response(JSON.stringify(res), {
                status: 200,
                headers: {'Content-Type': 'application/json'}
            })
        }

        // This handler returns a plain object { foo: 'bar', ... } defined here
        const handlerReturningObject: RequestMiddleware<TestContext> = (ctx, next) => {
            return {foo: 'bar', receivedData: ctx.data}
        }

        const ctx = makeContext<TestContext>({data: 3})
        const res = await runHandler(ctx, [jsonifyMiddleware, handlerReturningObject])

        expect(res).toBeInstanceOf(Response)
        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toBe('application/json')
        expect(await res.json()).toEqual({foo: 'bar', receivedData: 3}) // Assert object content
    })


    it('next() called multiple times should throw', () => {
        const multiNextMiddleware: RequestMiddleware = async (ctx, next) => {
            await next() // First call
            // Second call should throw
            await next()
            // This should not be reached
            return new Response("Should not reach here", {status: 500})
        }

        const finalOkMiddleware: RequestMiddleware = (ctx, next): Response => {
            return new Response("OK", {status: 200})
        }

        expect(runHandler(makeContext(), [multiNextMiddleware, finalOkMiddleware]))
            .rejects
            .toThrow('next() called more than once in a single middleware')
    })

    it('Middleware returning null is caught by final check', () => {
        const badMiddleware: RequestMiddleware = (ctx, next) => {
            return null // Return null instead of Response/void
        }
        expect(runHandler(makeContext(), [badMiddleware]))
            .rejects
            .toThrow('Middleware chain completed without returning a Response. Final value was of type: null')
    })

    it('Middleware returning number is caught by final check', () => {
        const badMiddleware: RequestMiddleware = (ctx, next) => {
            return 123 // Return number
        }
        expect(runHandler(makeContext(), [badMiddleware]))
            .rejects
            .toThrow('Middleware chain completed without returning a Response. Final value was of type: number')
    })

    it('Automatically calls next()', async () => {
        const ctx = makeContext()
        const res = await runHandler(ctx,[
            (c:RequestContext<{a?:number}>) => {c.a = 1},
            (c:RequestContext<{a:number,b?:number}>) => {c.b = 2},
            (c:RequestContext<{a:number,b:number}>) => new Response('OK'),
        ])
        expect(await res.text()).toBe('OK')
        expect(ctx).toEqual(expect.objectContaining({a: 1, b: 2}))
    })
})
