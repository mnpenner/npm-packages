#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {resolve} from './resolve.ts'
import {err, ok, type Ok, type SyncResult} from '../sync-result.ts'
import {expectType, type TypeEqual} from '../type-assert.ts'

describe('resolve', () => {
    it('wraps plain values in Ok', () => {
        const value = resolve(123)

        expectType<TypeEqual<typeof value, Ok<number>>>(true)
        expect(value.ok).toBe(true)
        if(!value.ok) return

        expect(value.value).toBe(123)
    })

    it('returns existing SyncResults unchanged', () => {
        const okResult = ok('hi')
        const errResult = err('boom')

        const okPassed = resolve(okResult)
        const errPassed = resolve(errResult)

        const okAssignable: SyncResult<string, never> = okPassed
        const errAssignable: SyncResult<never, string> = errPassed
        expectType<typeof okAssignable>(okAssignable)
        expectType<typeof errAssignable>(errAssignable)

        expect(okPassed).toBe(okResult)
        expect(errPassed).toBe(errResult)
    })
})
