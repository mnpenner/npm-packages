#!/usr/bin/env -S bun test
import {describe, expect, it} from 'bun:test'
import {firstOk, firstSettled} from './first.ts'
import {nj} from '../nj.ts'
import {err, type Result} from '../result.ts'
import {expectType, type TypeEqual} from '../internal/type-assert.ts'
import type {NeverjectPromise} from '../neverject-promise.ts'
import type {DetailedError} from '../detailed-error.ts'

describe('firstSettled', () => {
    it('yields the earliest result regardless of success or failure', async () => {
        const slowOk = nj(new Promise<number>((resolve) => setTimeout(() => resolve(1), 10)))
        const fastErr = nj(err('nope'))

        const promise = firstSettled([slowOk, fastErr] as const)
        expectType<TypeEqual<typeof promise, NeverjectPromise<number, string | DetailedError<unknown>>>>(true)

        const settled = await promise
        expectType<TypeEqual<typeof settled, Result<number, string | DetailedError<unknown>>>>(true)
        expect(settled.ok).toBe(false)
        if(settled.ok) return

        expect(settled.error).toBe('nope')
    })
})

describe('firstOk', () => {
    it('resolves on the first Ok even if Errs arrive earlier', async () => {
        const fastErr = nj(err('fail fast'))
        const slowOk = nj(new Promise<number>((resolve) => setTimeout(() => resolve(2), 5)))
        const slowerErr = nj(new Promise<Result<number, string>>((resolve) => setTimeout(() => resolve(err('late fail')), 15)))

        const promise = firstOk([fastErr, slowOk, slowerErr] as const)
        expectType<TypeEqual<typeof promise, NeverjectPromise<number, (string | DetailedError<unknown>)[]>>>(true)

        const settled = await promise
        expectType<TypeEqual<typeof settled, Result<number, (string | DetailedError<unknown>)[]>>>(true)
        expect(settled.ok).toBe(true)
        if(!settled.ok) return

        expect(settled.value).toBe(2)
    })

    it('collects all errors when no input succeeds', async () => {
        const allFail = firstOk([
            nj(err('first')),
            nj(new Promise<string>((_, reject) => reject('second'))),
        ] as const)

        expectType<TypeEqual<typeof allFail, NeverjectPromise<string, (string | DetailedError<unknown>)[]>>>(true)

        const settled = await allFail
        expectType<TypeEqual<typeof settled, Result<string, (string | DetailedError<unknown>)[]>>>(true)
        expect(settled.ok).toBe(false)
        if(settled.ok) return

        expect(settled.error).toHaveLength(2)
        expect(settled.error[0]).toBe('first')
        expect(settled.error[1]).toBeInstanceOf(Error)
        expect((settled.error[1] as DetailedError<unknown>).details).toBe('second')
    })
})
