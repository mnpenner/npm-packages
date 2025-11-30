#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {call} from './call.ts'
import {err, ok, type SyncResult} from '../sync-result.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {DetailedError} from '../detailed-error.ts'
import {mayFail1} from '../internal/test-functions.ts'

describe('call', () => {
    it('wraps returned values in Ok', () => {
        const result = call(() => 42)

        expectType<TypeEqual<typeof result, SyncResult<number, DetailedError<unknown>>>>(true)
        expect(result.ok).toBe(true)
        if(!result.ok) return

        expect(result.value).toBe(42)
    })

    it('passes through returned SyncResults unchanged', () => {
        const result = call(mayFail1)
        expectType<TypeEqual<typeof result, SyncResult<number, string>>>(true)
    })

    it('handles Ok', () => {
        const okResult = ok('hi')

        const okPassed = call(() => okResult)

        expectType<TypeEqual<typeof okPassed, SyncResult<string, never>>>(true)

        expect(okPassed).toBe(okResult)
    })

    it('handles  Err', () => {
        const errResult = err('boom')

        const errPassed = call(() => err('boom'))

        expectType<TypeEqual<typeof errPassed, SyncResult<never, string>>>(true)

        expect(errPassed).toBe(errResult)
    })

    it('captures thrown errors as Err<DetailedError>', () => {
        const reason = 'boom'
        const throwingFn = () => { throw reason }
        const result = call(throwingFn)

        expectType<TypeEqual<typeof result, SyncResult<never, unknown>>>(true)
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBeInstanceOf(Error)
        const detailed = result.error as {details?: unknown}
        expect(detailed.details).toBe(reason)
    })
})
