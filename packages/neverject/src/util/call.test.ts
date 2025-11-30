#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {call, callAsync} from './call.ts'
import {err, ok, type Result} from '../result.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {DetailedError} from '../detailed-error.ts'
import {mayFail1} from '../internal/test-functions.ts'
import type {NeverjectPromise} from '../neverject-promise.ts'

describe('call', () => {
    it('wraps returned values in Ok', () => {
        const result = call(() => 42)

        expectType<TypeEqual<typeof result, Result<number, DetailedError<unknown>>>>(true)
        expect(result.ok).toBe(true)
        if(!result.ok) return

        expect(result.value).toBe(42)
    })

    it('passes through returned SyncResults unchanged', () => {
        const result = call(mayFail1)
        expectType<TypeEqual<typeof result, Result<number, string>>>(true)
    })

    it('handles Ok', () => {
        const okResult = ok('hi')

        const okPassed = call(() => okResult)

        expectType<TypeEqual<typeof okPassed, Result<string, never>>>(true)

        expect(okPassed).toBe(okResult)
    })

    it('handles Err', () => {
        const errResult = err('boom')

        const errPassed = call(() => errResult)

        expectType<TypeEqual<typeof errPassed, Result<never, string>>>(true)

        expect(errPassed).toBe(errResult)
    })

    it('captures thrown errors as Err<DetailedError>', () => {
        const reason = 'boom'
        const throwingFn = () => { throw reason }
        const result = call(throwingFn)

        expectType<TypeEqual<typeof result, Result<never, unknown>>>(true)
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBeInstanceOf(Error)
        const detailed = result.error as {details?: unknown}
        expect(detailed.details).toBe(reason)
    })
})

describe('callAsync', () => {
    it('wraps resolved values in Ok', async () => {
        const asyncResult = callAsync(async () => 42)

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<number, DetailedError<unknown>>>>(true)

        const settled = await asyncResult
        expect(settled.ok).toBe(true)
        if(!settled.ok) return

        expect(settled.value).toBe(42)
    })

    it('passes through returned AsyncResults unchanged', async () => {
        const asyncResult = callAsync(() => Promise.resolve(ok('hi')))

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<string, never>>>(true)

        const settled = await asyncResult
        expect(settled.ok).toBe(true)
        if(!settled.ok) return

        expect(settled.value).toBe('hi')
    })

    it('handles Err results', async () => {
        const asyncResult = callAsync(() => Promise.resolve(err('boom')))

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<never, string>>>(true)

        const settled = await asyncResult
        expect(settled.ok).toBe(false)
        if(settled.ok) return

        expect(settled.error).toBe('boom')
    })

    it('captures thrown errors as Err<DetailedError>', async () => {
        const reason = 'boom'
        const asyncResult = callAsync(async () => { throw reason })

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<never, DetailedError<unknown>>>>(true)

        const settled = await asyncResult
        expect(settled.ok).toBe(false)
        if(settled.ok) return

        expect(settled.error).toBeInstanceOf(Error)
        expect(settled.error.details).toBe(reason)
    })
})
