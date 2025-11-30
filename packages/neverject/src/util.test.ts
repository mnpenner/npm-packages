#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {all} from './util.ts'
import {nj} from './nj.ts'
import { err, ok, type SyncResult} from './sync-result.ts'
import {expectType, type TypeEqual} from './type-assert.ts'
import type {AsyncResult} from './async-result.ts'
import type {DetailedError} from './detailed-error.ts'

describe('all', () => {
    it('wraps a record of values/promises/results into an AsyncResult of SyncResults', async () => {
        const failingPromise: Promise<number> = new Promise((_, reject) => reject('bad'))
        const asyncResult = all({
            value: nj(1),
            promise: Promise.resolve(2),
            ok: nj(ok(3)),
            err: nj(err('boom')),
            njPromise: nj(failingPromise),
        })

        type Expected = AsyncResult<{
            value: SyncResult<number, never>;
            promise: SyncResult<number, DetailedError<unknown>>;
            ok: SyncResult<number, never>;
            err: SyncResult<never, string>;
            njPromise: SyncResult<number, DetailedError<unknown>>;
        }, never>
        const assertAssignable: Expected = asyncResult
        const assertInverse: typeof asyncResult = assertAssignable
        expectType<TypeEqual<typeof asyncResult, Expected>>(true)

        const settledResult = await asyncResult
        expectType<TypeEqual<typeof settledResult, SyncResult<{
            value: SyncResult<number, never>;
            promise: SyncResult<number, DetailedError<unknown>>;
            ok: SyncResult<number, never>;
            err: SyncResult<never, string>;
            njPromise: SyncResult<number, DetailedError<unknown>>;
        }, never>>>(true)
        expect(settledResult.ok).toBe(true)
        if(!settledResult.ok) return

        const settledValue = settledResult.value
        expectType<TypeEqual<typeof settledValue, {
            value: SyncResult<number, never>;
            promise: SyncResult<number, DetailedError<unknown>>;
            ok: SyncResult<number, never>;
            err: SyncResult<never, string>;
            njPromise: SyncResult<number, DetailedError<unknown>>;
        }>>(true)

        expect(settledValue.value.ok).toBe(true)
        if(settledValue.value.ok) {
            expect(settledValue.value.value).toBe(1)
        }

        expect(settledValue.promise.ok).toBe(true)
        if(settledValue.promise.ok) {
            expect(settledValue.promise.value).toBe(2)
        }

        expect(settledValue.ok.ok).toBe(true)
        expect(settledValue.err.ok).toBe(false)
        if(!settledValue.err.ok) {
            expect(settledValue.err.error).toBe('boom')
        }

        expect(settledValue.njPromise.ok).toBe(false)
        if(!settledValue.njPromise.ok) {
            expect(settledValue.njPromise.error).toBeInstanceOf(Error)
        }
    })

    it('preserves keys without index juggling', async () => {
        const settled = await all({a: nj(1), b: nj(err('x'))})

        expect(settled.ok).toBe(true)
        if(!settled.ok) return

        expect(settled.value).toHaveProperty('a')
        expect(settled.value).toHaveProperty('b')
        expect(settled.value.a.ok).toBe(true)
        expect(settled.value.b.ok).toBe(false)
        if(!settled.value.b.ok) {
            expect(settled.value.b.error).toBe('x')
        }
    })
})
