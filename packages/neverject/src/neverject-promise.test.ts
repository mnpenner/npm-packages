#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'

import {nj} from './nj.ts'
import type {NeverjectPromise} from './neverject-promise.ts'
import {err, ok, type Result} from './result.ts'
import {expectType, type TypeEqual} from './internal/type-assert.ts'
import type {DetailedError} from './detailed-error.ts'

describe('NeverjectPromise helpers', () => {
    it('maps successes and flattens returned results', async () => {
        const mapped = nj(ok(2)).map((value) => ok(value * 2))
        expectType<TypeEqual<typeof mapped, NeverjectPromise<number, DetailedError<unknown>>>>(true)

        const result = await mapped
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe(4)
        }

        const mappedToErr = nj(ok(3)).map<number, string>(() => err('fail'))
        expectType<TypeEqual<typeof mappedToErr, NeverjectPromise<number, string | DetailedError<unknown>>>>(true)

        const errResult = await mappedToErr
        expect(errResult.ok).toBe(false)
        if(!errResult.ok) {
            expect(errResult.error).toBe('fail')
        }
    })

    it('maps errors without touching successful values', async () => {
        const mappedError = nj(err('oops')).mapErr((error) => error.length)
        expectType<TypeEqual<typeof mappedError, NeverjectPromise<never, number | DetailedError<unknown>>>>(true)

        const result = await mappedError
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe(4)
        }
    })

    it('rewrites whole results via mapResult', async () => {
        const mapped = nj(ok(1) as Result<number, string>).mapResult<string, number>((result) => result.ok ? ok('done') : err(result.error.length))
        expectType<TypeEqual<typeof mapped, NeverjectPromise<string, number | DetailedError<unknown>>>>(true)

        const result = await mapped
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe('done')
        }
    })

    it('returns raw values with valueOr', async () => {
        const value = await nj(ok('user')).valueOr('guest')
        expect(value.ok).toBe(true)
        if(value.ok) {
            expect(value.value).toBe('user')
        }

        const fallback = await nj(err('missing')).valueOr((error) => `fallback:${error}`)
        expect(fallback.ok).toBe(true)
        if(fallback.ok) {
            expect(fallback.value).toBe('fallback:missing')
        }
    })

    it('taps successes and forwards errors', async () => {
        let tapped = 0
        const tappedPromise = nj(ok(5)).tap((value) => { tapped = value })
        expectType<TypeEqual<typeof tappedPromise, NeverjectPromise<number, never>>>(true)

        const success = await tappedPromise
        expect(success.ok).toBe(true)
        if(success.ok) {
            expect(success.value).toBe(5)
        }
        expect(tapped).toBe(5)

        const failedTap = nj(ok(1)).tap(() => err('tap failed'))
        expectType<TypeEqual<typeof failedTap, NeverjectPromise<number, never>>>(true)
        const failedResult = await failedTap
        expect(failedResult.ok).toBe(true)
        if(failedResult.ok) {
            expect(failedResult.value).toBe(1)
        }
    })

    it('taps only errors', async () => {
        let tappedErr: string | undefined
        const tappedPromise = nj(err('boom')).tapErr((error) => { tappedErr = error })
        expectType<TypeEqual<typeof tappedPromise, NeverjectPromise<never, string>>>(true)

        const result = await tappedPromise
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe('boom')
            if(tappedErr === undefined) throw new Error('tapErr did not run')
            expect(tappedErr).toBe('boom')
        }
    })

    it('taps results while preserving the original value', async () => {
        let sawOk = false
        const tappedResult = await nj(ok(10)).tapResult((result) => {
            sawOk = result.ok
        })

        expect(tappedResult.ok).toBe(true)
        if(tappedResult.ok) {
            expect(tappedResult.value).toBe(10)
        }
        expect(sawOk).toBe(true)
    })

    it('recovers from errors', async () => {
        const recovered = nj(err('offline')).recover((error) => `cached:${error}`)
        expectType<TypeEqual<typeof recovered, NeverjectPromise<string, string | DetailedError<unknown>>>>(true)

        const result = await recovered
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe('cached:offline')
        }

        const failedRecovery = nj(err('boom')).recover<number, number>(() => err(500))
        expectType<TypeEqual<typeof failedRecovery, NeverjectPromise<number, string | number | DetailedError<unknown>>>>(true)
        const failed = await failedRecovery
        expect(failed.ok).toBe(false)
        if(!failed.ok) {
            expect(failed.error).toBe(500)
        }
    })
})
