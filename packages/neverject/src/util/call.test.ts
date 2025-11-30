#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {call} from './call.ts'
import {err, ok, type Result} from '../result.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {DetailedError} from '../detailed-error.ts'
import {mayFail1} from '../internal/test-functions.ts'

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
