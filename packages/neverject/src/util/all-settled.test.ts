#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {allOk, allOkObj, type AllOkObject, allSettled, allSettledObj} from './all-settled.ts'
import {nj} from '../nj.ts'
import {err, ok, type Result} from '../result.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {NeverjectPromise} from '../neverject-promise.ts'
import type {DetailedError} from '../detailed-error.ts'

describe('allSettledOb', () => {
    it('wraps a record of values/promises/results into an AsyncResult of SyncResults', async () => {
        const failingPromise: Promise<number> = new Promise((_, reject) => reject('bad'))
        const asyncResult = allSettledObj({
            value: nj(1),
            promise: Promise.resolve(2),
            ok: nj(ok(3)),
            err: nj(err('boom')),
            njPromise: nj(failingPromise),
        })

        type Expected = NeverjectPromise<{
            value: Result<number, never>;
            promise: Result<number, DetailedError<unknown>>;
            ok: Result<number, never>;
            err: Result<never, string>;
            njPromise: Result<number, DetailedError<unknown>>;
        }, never>
        const assertAssignable: Expected = asyncResult
        const assertInverse: typeof asyncResult = assertAssignable
        expectType<TypeEqual<typeof asyncResult, Expected>>(true)

        const settledResult = await asyncResult
        expectType<TypeEqual<typeof settledResult, Result<{
            value: Result<number, never>;
            promise: Result<number, DetailedError<unknown>>;
            ok: Result<number, never>;
            err: Result<never, string>;
            njPromise: Result<number, DetailedError<unknown>>;
        }, never>>>(true)
        expect(settledResult.ok).toBe(true)
        if(!settledResult.ok) return

        const settledValue = settledResult.value
        expectType<TypeEqual<typeof settledValue, {
            value: Result<number, never>;
            promise: Result<number, DetailedError<unknown>>;
            ok: Result<number, never>;
            err: Result<never, string>;
            njPromise: Result<number, DetailedError<unknown>>;
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
        const settled = await allSettledObj({a: nj(1), b: nj(err('x'))})

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

describe('allSettled', () => {
    it('returns an array of SyncResults and never Errs', async () => {
        const settled = await allSettled([
            nj(1),
            nj(err('boom')),
            Promise.resolve('ok'),
        ] as const)

        expectType<TypeEqual<typeof settled, Result<readonly [
            Result<number, never>,
            Result<never, string>,
            Result<string, DetailedError<unknown>>
        ], never>>>(true)

        expect(settled.ok).toBe(true)
        if(!settled.ok) return

        expect(settled.value[0].ok).toBe(true)
        expect(settled.value[1].ok).toBe(false)
        expect(settled.value[2].ok).toBe(true)

        if(settled.value[0].ok) expect(settled.value[0].value).toBe(1)
        if(!settled.value[1].ok) expect(settled.value[1].error).toBe('boom')
        if(settled.value[2].ok) expect(settled.value[2].value).toBe('ok')
    })
})

describe('allOkObj', () => {
    it('returns Ok when all entries are Ok', async () => {
        const combined = await allOkObj({
            a: nj(1),
            b: nj(Promise.resolve(2)),
        })

        expectType<TypeEqual<typeof combined, Result<AllOkObject<{
            a: NeverjectPromise<number, never>
            b: NeverjectPromise<number, DetailedError<unknown>>
        }>, DetailedError<unknown>>>>(true)

        expect(combined.ok).toBe(true)
        if(!combined.ok) return

        expect(combined.value).toEqual({a: 1, b: 2})
    })

    it('short-circuits on the first Err', async () => {
        const combined = await allOkObj({a: nj(1), b: nj(err('x')), c: nj(3)})

        expect(combined.ok).toBe(false)
        if(combined.ok) return

        expect(combined.error).toBe('x')
    })
})

describe('allOk', () => {
    it('returns Ok with array of values when all succeed', async () => {
        const combined = await allOk([nj(1), nj(Promise.resolve('ok'))] as const)

        expectType<TypeEqual<typeof combined, Result<readonly [number, string], DetailedError<unknown>>>>(true)


        expect(combined.ok).toBe(true)
        if(!combined.ok) return

        expect(combined.value).toEqual([1, 'ok'])
    })

    it('returns Err on the first failure', async () => {
        const combined = await allOk([nj(1), nj(err('x')), nj(3)] as const)

        expect(combined.ok).toBe(false)
        if(combined.ok) return

        expect(combined.error).toBe('x')
    })
})
