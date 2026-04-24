#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {okAsync, errAsync} from './async.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {NeverjectPromise} from '../neverject-promise.ts'

describe('okAsync', () => {
    it('wraps a value in a resolved Ok', async () => {
        const promise = okAsync(123)

        expectType<TypeEqual<typeof promise, NeverjectPromise<number, never>>>(true)

        const result = await promise
        expect(result.ok).toBe(true)
        if(!result.ok) return

        expect(result.value).toBe(123)
    })
})

describe('errAsync', () => {
    it('wraps an error payload in a resolved Err', async () => {
        const promise = errAsync('boom')

        expectType<TypeEqual<typeof promise, NeverjectPromise<never, string>>>(true)

        const result = await promise
        expect(result.ok).toBe(false)
        if(result.ok) return

        expect(result.error).toBe('boom')
    })
})
