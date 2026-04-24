#!/usr/bin/env -S bun test
import {describe, expect, it} from "bun:test"
import {nj} from './nj.ts'
import type {NeverjectPromise} from './neverject-promise.ts'
import {err, ok, type Result} from './result.ts'
import {expectType, type TypeEqual} from './internal/type-assert.ts'
import type {DetailedError} from './detailed-error.ts'

describe('nj overloads', () => {
    it('wraps a promise', async () => {
        const asyncResult = nj(Promise.resolve(1))

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<number, DetailedError<unknown>>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe(1)
        }
    })

    it('converts rejected promise reasons to Error', async () => {
        const rejectedPromise: Promise<string> = Promise.reject('bad')
        const asyncResult = nj(rejectedPromise)

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<string, DetailedError<unknown>>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBeInstanceOf(Error)
            expect(result.error.message).toContain('bad')
            expect(result.error.details).toBe('bad')
        }
    })

    it('wraps an error', async () => {
        const input = new Error('boom')
        const asyncResult = nj(input)

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<never, Error>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe(input)
        }
    })

    it('wraps a sync result', async () => {
        const syncResult = ok(2)
        const asyncResult = nj(syncResult)

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<number, never>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe(2)
        }
    })

    it('wraps a value', async () => {
        const asyncResult = nj({value: 'abc'})

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<{ value: string }, never>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toEqual({value: 'abc'})
        }
    })

    it('maps a promise rejection with an error function', async () => {
        const asyncResult = nj(
            new Promise<number>((_, reject) => reject(2)),
            (reason) => (reason as number) * 2,
        )

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<number, number>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe(4)
        }
    })

    it('maps a sync result error', async () => {
        const syncResult: Result<number, string> = err('fail')
        const asyncResult = nj<number, string, number>(syncResult, (error) => error.length)

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<number, number>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(false)
        if(!result.ok) {
            expect(result.error).toBe(4)
        }
    })

    it('preserves a value while changing the error type', async () => {
        const asyncResult = nj(5, (reason) => String(reason))

        expectType<TypeEqual<typeof asyncResult, NeverjectPromise<number, string>>>(true)

        const result = await asyncResult
        expect(result.ok).toBe(true)
        if(result.ok) {
            expect(result.value).toBe(5)
        }
    })
})
