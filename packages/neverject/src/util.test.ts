#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {all, type AllResults} from './util.ts'
import {nj} from './nj.ts'
import {Err, err, Ok, ok, type SyncResult} from './sync-result.ts'
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
        const _assertAssignable: Expected = asyncResult
        const _assertInverse: typeof asyncResult = _assertAssignable
        expectType<TypeEqual<typeof asyncResult, Expected>>(true)

        const settled = await asyncResult
        expectType<TypeEqual<typeof settled, SyncResult<{
            value: SyncResult<number, never>;
            promise: SyncResult<number, DetailedError<unknown>>;
            ok: SyncResult<number, never>;
            err: SyncResult<never, string>;
            njPromise: SyncResult<number, DetailedError<unknown>>;
        }, never>>>(true)
        expect(settled.ok).toBe(true)
        if(!settled.ok) return

        expect(settled.value.value.ok).toBe(true)
        if(settled.value.value.ok) {
            expect(settled.value.value.value).toBe(1)
        }

        expect(settled.value.promise.ok).toBe(true)
        if(settled.value.promise.ok) {
            expect(settled.value.promise.value).toBe(2)
        }

        expect(settled.value.ok.ok).toBe(true)
        expect(settled.value.err.ok).toBe(false)
        if(!settled.value.err.ok) {
            expect(settled.value.err.error).toBe('boom')
        }

        expect(settled.value.njPromise.ok).toBe(false)
        if(!settled.value.njPromise.ok) {
            expect(settled.value.njPromise.error).toBeInstanceOf(Error)
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
