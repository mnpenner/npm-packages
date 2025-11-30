#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {wrapAsyncFn, wrapFn} from './wrap-fn.ts'
import {err, type Result} from '../result.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {DetailedError} from '../detailed-error.ts'
import {mayFail1} from '../internal/test-functions.ts'
import type {NeverjectPromise} from '../neverject-promise.ts'

describe('wrapFn', () => {
    it('defers invocation and wraps returned values', () => {
        let calls = 0
        const wrapped = wrapFn((value: number) => {
            calls += 1
            return value * 2
        })

        expectType<TypeEqual<typeof wrapped, (value: number) => Result<number, DetailedError<unknown>>>>(true)

        expect(calls).toBe(0)
        const result = wrapped(3)
        expect(calls).toBe(1)

        expect(result.ok).toBe(true)
        if(!result.ok) return

        expect(result.value).toBe(6)
    })

    it('preserves SyncResult return types', () => {
        const wrapped = wrapFn(mayFail1)

        expectType<TypeEqual<typeof wrapped, () => Result<number, string>>>(true)
    })

    it('captures thrown errors when invoked', () => {
        const reason = 'boom'
        const wrapped = wrapFn(() => { throw reason })

        const result = wrapped()
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBeInstanceOf(Error)
        expect((result.error as {details?: unknown}).details).toBe(reason)
    })

    it('uses a custom error mapper', () => {
        type ParseError = {message: string}
        const toParseError = (): ParseError => ({message: 'Parse Error'})
        const safeJsonParse = wrapFn((input: string) => JSON.parse(input) as {id: number}, toParseError)

        expectType<TypeEqual<typeof safeJsonParse, (input: string) => Result<{id: number}, ParseError>>>(true)

        const result = safeJsonParse('{')
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toEqual({message: 'Parse Error'})
    })
})

describe('wrapAsyncFn', () => {
    it('defers invocation and wraps resolved values', async () => {
        let calls = 0
        const wrapped = wrapAsyncFn(async (value: number) => {
            calls += 1
            return value + 1
        })

        expectType<TypeEqual<typeof wrapped, (value: number) => NeverjectPromise<number, DetailedError<unknown>>>>(true)

        expect(calls).toBe(0)
        const asyncResult = wrapped(4)
        expect(calls).toBe(1)

        const settled = await asyncResult
        expect(settled.ok).toBe(true)
        if(!settled.ok) return

        expect(settled.value).toBe(5)
    })

    it('passes through AsyncResult returns', async () => {
        const wrapped = wrapAsyncFn(async () => err('boom'))

        expectType<TypeEqual<typeof wrapped, () => NeverjectPromise<never, string>>>(true)

        const settled = await wrapped()
        expect(settled.ok).toBe(false)
        if(settled.ok) return

        expect(settled.error).toBe('boom')
    })

    it('captures thrown errors on invocation', async () => {
        const reason = 'boom'
        const wrapped = wrapAsyncFn(async () => { throw reason })

        const settled = await wrapped()
        expectType<TypeEqual<typeof settled, Result<never, DetailedError<unknown>>>>(true)

        expect(settled.ok).toBe(false)
        if(settled.ok) return

        expect(settled.error).toBeInstanceOf(Error)
        expect(settled.error.details).toBe(reason)
    })

    it('uses a custom error mapper', async () => {
        type ParseError = {message: string}
        const toParseError = (): ParseError => ({message: 'Parse Error'})
        const safeJsonParse = wrapAsyncFn(async (input: string) => JSON.parse(input) as {id: number}, toParseError)

        expectType<TypeEqual<typeof safeJsonParse, (input: string) => NeverjectPromise<{id: number}, ParseError>>>(true)

        const settled = await safeJsonParse('{')
        expect(settled.ok).toBe(false)
        if(settled.ok) return

        expect(settled.error).toEqual({message: 'Parse Error'})
    })
})
