#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'

import {nj} from './nj.ts'
import type {NeverjectPromise} from './neverject-promise.ts'
import {err, ok, type Result} from './result.ts'
import {expectType, type TypeEqual} from './internal/type-assert.ts'

describe('map', () => {
    it('maps successes and flattens returned results', async () => {
        const mapped = nj(ok(2)).map((value) => ok(value * 2))
        expectType<TypeEqual<typeof mapped, NeverjectPromise<number, never>>>(true)

        const result = await mapped
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe(4)
        }
    })

    it('propagates mapped Err results', async () => {
        const mappedToErr = nj(ok(3)).map<number, string>(() => err('fail'))
        expectType<TypeEqual<typeof mappedToErr, NeverjectPromise<number, string>>>(true)

        const errResult = await mappedToErr
        expect(errResult.ok).toBe(false)
        if(!errResult.ok) {
            expect(errResult.error).toBe('fail')
        }
    })

    it('flattens returned NeverjectPromise values', async () => {
        const mapped = nj(ok(1)).map((value) => nj(ok(value + 1)))
        expectType<TypeEqual<typeof mapped, NeverjectPromise<number, never>>>(true)

        const result = await mapped
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe(2)
        }
    })
})

describe('mapErr', () => {
    it('maps errors without touching successful values', async () => {
        const mappedError = nj(err('oops')).mapErr((error) => error.length)
        expectType<TypeEqual<typeof mappedError, NeverjectPromise<never, number>>>(true)

        const result = await mappedError
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe(4)
        }
    })

    it('remaps error type while preserving Ok values', async () => {
        const mappedError = nj(ok(5) as Result<number, string>).mapErr((error) => error.length)
        expectType<TypeEqual<typeof mappedError, NeverjectPromise<number, number>>>(true)

        const result = await mappedError
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe(5)
        }
    })

    it('flattens returned NeverjectPromise errors', async () => {
        const mappedError = nj(err('oops')).mapErr((error) => nj(err(error.length)))
        expectType<TypeEqual<typeof mappedError, NeverjectPromise<never, number>>>(true)

        const result = await mappedError
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe(4)
        }
    })
})

describe('mapResult', () => {
    it('rewrites the entire result', async () => {
        const mapped = nj(ok(1) as Result<number, string>).mapResult<string, number>((result) => result.ok ? ok('done') : err(result.error.length))
        expectType<TypeEqual<typeof mapped, NeverjectPromise<string, number>>>(true)

        const result = await mapped
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe('done')
        }
    })
})

describe('valueOr', () => {
    it('returns the original ok value', async () => {
        const value = nj(ok('user')).valueOr('guest')
        expectType<TypeEqual<typeof value, NeverjectPromise<string, never>>>(true)

        const result = await value
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe('user')
        }
    })

    it('returns the original err value unchanged', async () => {
        const value = nj(err('nope')).valueOr('guest')
        expectType<TypeEqual<typeof value, NeverjectPromise<string, never>>>(true)

        const result = await value
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe('guest')
        }
    })

    it('returns a fallback for errors', async () => {
        const fallback = nj(err('missing')).valueOr((error) => `fallback:${error}`)
        expectType<TypeEqual<typeof fallback, NeverjectPromise<string, never>>>(true)

        const result = await fallback
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe('fallback:missing')
        }
    })
})

describe('tap', () => {
    it('runs side effects on success', async () => {
        let tapped = 0
        const tappedPromise = nj(ok(5)).tap((value) => {
            tapped = value
        })
        expectType<TypeEqual<typeof tappedPromise, NeverjectPromise<number, never>>>(true)

        const success = await tappedPromise
        expect(success.ok).toBe(true)
        if(success.ok) {
            expect(success.value).toBe(5)
        }
        expect(tapped).toBe(5)
    })

    it('ignores returned errors from the tap', async () => {
        const failedTap = nj(ok(1)).tap(() => err('tap failed'))
        expectType<TypeEqual<typeof failedTap, NeverjectPromise<number, never>>>(true)

        const failedResult = await failedTap
        expect(failedResult.ok).toBe(true)
        if(failedResult.ok) {
            expect(failedResult.value).toBe(1)
        }
    })
})

describe('tapErr', () => {
    it('runs side effects only on errors', async () => {
        let tappedErr: string | undefined
        const tappedPromise = nj(err('boom')).tapErr((error) => {
            tappedErr = error
        })
        expectType<TypeEqual<typeof tappedPromise, NeverjectPromise<never, string>>>(true)

        const result = await tappedPromise
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe('boom')
            if(tappedErr === undefined) throw new Error('tapErr did not run')
            expect(tappedErr).toBe('boom')
        }
    })
})

describe('tapResult', () => {
    it('taps the whole result while preserving the original value', async () => {
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
})

describe('recover', () => {
    it('recovers from errors', async () => {
        const recovered = nj(err('offline')).recover((error) => `cached:${error}`)
        expectType<TypeEqual<typeof recovered, NeverjectPromise<string, never>>>(true)

        const result = await recovered
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe('cached:offline')
        }
    })

    it('returns a new Err when recovery fails', async () => {
        const failedRecovery = nj<never, string>(err('offline')).recover(() => err(500))
        expectType<TypeEqual<typeof failedRecovery, NeverjectPromise<never, number>>>(true)

        const result = await failedRecovery
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe(500)
        }
    })
})
