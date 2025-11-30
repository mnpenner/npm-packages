#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {call} from './call.ts'
import {err, ok, type SyncResult} from '../sync-result.ts'
import {expectType, type TypeEqual} from '../type-assert.ts'
import type {DetailedError} from '../detailed-error.ts'

describe('call', () => {
    it('wraps returned values in Ok', () => {
        const result = call(() => 42)

        expectType<TypeEqual<typeof result, SyncResult<number, DetailedError<unknown>>>>(true)
        expect(result.ok).toBe(true)
        if(!result.ok) return

        expect(result.value).toBe(42)
    })

    it('passes through returned SyncResults unchanged', () => {
        const okResult = ok('hi')
        const errResult = err('boom')

        const okPassed = call(() => okResult)
        const errPassed = call(() => errResult)

        expectType<TypeEqual<typeof okPassed, SyncResult<string, unknown>>>(true)
        expectType<TypeEqual<typeof errPassed, SyncResult<unknown, string | DetailedError>>>(true)

        expect(okPassed).toBe(okResult)
        expect(errPassed).toBe(errResult)
    })

    it('captures thrown errors as Err<DetailedError>', () => {
        const reason = 'boom'
        const result = call(() => { throw reason })

        expectType<TypeEqual<typeof result, SyncResult<unknown, unknown>>>(true)
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBeInstanceOf(Error)
        const detailed = result.error as {details?: unknown}
        expect(detailed.details).toBe(reason)
    })
})
