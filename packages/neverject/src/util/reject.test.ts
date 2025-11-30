#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {reject, rejectWithError} from './reject.ts'
import {err, ok, type Err, type SyncResult} from '../sync-result.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {DetailedError} from '../detailed-error.ts'

describe('rejectWithError', () => {
    it('wraps non-Result reasons in Err<DetailedError>', () => {
        const reason = 'boom'
        const result = rejectWithError(reason)

        expectType<TypeEqual<typeof result, Err<DetailedError<string>>>>(true)
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.details).toBe(reason)
    })

    it('preserves Error types when provided', () => {
        const error = new Error('bad')
        const result = rejectWithError(error)

        expectType<TypeEqual<typeof result, Err<Error>>>(true)
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBe(error)
    })

    it('returns existing SyncResults unchanged', () => {
        const okResult = ok(123)
        const errResult = err('x')

        const okPassed = rejectWithError(okResult)
        const errPassed = rejectWithError(errResult)

        const okAssignable: SyncResult<number, never> = okPassed
        const errAssignable: SyncResult<never, string> = errPassed
        expectType<typeof okAssignable>(okAssignable)
        expectType<typeof errAssignable>(errAssignable)

        expect(okPassed).toBe(okResult)
        expect(errPassed).toBe(errResult)
    })
})

describe('reject', () => {
    it('wraps non-Result reasons without converting to DetailedError', () => {
        const reason = 'boom'
        const result = reject(reason)

        expectType<TypeEqual<typeof result, Err<string>>>(true)
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBe(reason)
    })

    it('returns existing SyncResults unchanged', () => {
        const okResult = ok(123)
        const errResult = err('x')

        const okPassed = reject(okResult)
        const errPassed = reject(errResult)

        const okAssignable: SyncResult<number, never> = okPassed
        const errAssignable: SyncResult<never, string> = errPassed
        expectType<typeof okAssignable>(okAssignable)
        expectType<typeof errAssignable>(errAssignable)

        expect(okPassed).toBe(okResult)
        expect(errPassed).toBe(errResult)
    })
})
