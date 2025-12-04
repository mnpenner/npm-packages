#!/usr/bin/env -S bun
import {err, nj, ok, type Result} from '../index.ts'
import type {DetailedError} from '../detailed-error.ts'
import * as nju from '../util'
import {describe, example, log, runExamples} from './example-runner.ts'
import {mayFail1, mayFail2} from './test-functions.ts'
import {expect, mock} from 'bun:test'

describe('Sync results', () => {
    example('Ok result', () => {
        const result = ok({myData: 'test'})

        log('ok', result.ok)
        log('result', result)
    })

    example('Err result', () => {
        const result = err('Oh noooo')

        log('ok', result.ok)
        log('result', result)
    })
})

describe('Async results', () => {
    example('Async Ok via nj', async () => {
        // https://github.com/supermacro/neverthrow?tab=readme-ov-file#okasync
        const njPromise = nj({myData: 'test'})
        const result = await njPromise

        log('result', result)
    })

    example('Async Err via nj', async () => {
        // https://github.com/supermacro/neverthrow?tab=readme-ov-file#errasync
        const njPromise = nj(err('Oh nooo'))
        const result = await njPromise

        log('ok', result.ok)
        log('result', result)
    })

    example('Async Error via nj', async () => {
        const njPromise = nj(new Error('err0r'))
        const result = await njPromise

        if(!result.ok) {
            log('error message', result.error.message)
        }
    })
})

describe('Utilities', () => {
    example('Combining values with allOk', async () => {
        const tuple = <T extends any[]>(...args: T): T => args

        const combinedTuple = await nju.allOk(tuple(nj('a'), nj(2)))
        const combinedArray = await nju.allOk([nj('a'), Promise.reject(2)] as const)

        log('combined tuple', combinedTuple)
        log('combined array', combinedArray)
    })

    example('Combining object values with allOkObj', async () => {
        const combined = await nju.allOkObj({
            user: nj({id: 1, name: 'Ada'}),
            profile: nj({bio: 'Always learning'}),
        })

        log('allOkObj result', combined)

        const failed = await nju.allOkObj({
            user: nj({id: 1}),
            preferences: nj(err('missing preferences')),
        })

        log('allOkObj failed result', failed)
    })

    example('Settling array entries with allSettled', async () => {
        const settled = await nju.allSettled([nj('a'), nj(err('boom'))] as const)

        log('allSettled result', settled)
    })

    example('Settling object entries with allSettledObj', async () => {
        const settled = await nju.allSettledObj({
            user: nj({id: 1}),
            profile: nj(err('missing profile')),
        })

        log('allSettledObj result', settled)
    })

    example('SafeTry style propagation', () => {
        // https://github.com/supermacro/neverthrow?tab=readme-ov-file#safetry
        function myFunc1(): Result<number, string> {
            const result1 = mayFail1()
            if(!result1.ok) return result1

            const result2 = mayFail2()
            if(!result2.ok) return result2

            return ok(result1.value + result2.value)
        }

        function myFunc2() {
            return nju.call(() => {
                const result1 = mayFail1()
                if(!result1.ok) throw result1.error

                const result2 = mayFail2()
                if(!result2.ok) throw result2.error

                return result1.value + result2.value
            })
        }

        log('manual propagation', myFunc1())
        log('call helper', myFunc2())
    })

    example('Safe JSON parsing with wrapFn', () => {
        type ParseError = {message: string}
        const toParseError = (): ParseError => ({message: 'Parse Error'})

        const safeJsonParse = nju.wrapFn(JSON.parse, toParseError)

        const res = safeJsonParse('{')

        log('ok', res.ok)
        if(!res.ok) {
            log('parse failure message', res.error.message)
        }
    })
})

describe('Fetch helpers', () => {
    const originalFetch = globalThis.fetch

    type FetchInput = Parameters<typeof fetch>[0]
    type FetchInit = Parameters<typeof fetch>[1]

    type NetworkFetchError = {kind: 'network'; error: DetailedError<unknown>}
    type HttpFetchError = {
        kind: 'http'
        status: number
        statusText: string
        url: string
        bodyText?: string
        headers: Record<string, string>
    }
    type NjFetchError = NetworkFetchError | HttpFetchError

    async function readBodyText(response: Response): Promise<string | undefined> {
        try {
            const text = await response.clone().text()
            const trimmed = text.trim()
            return trimmed.length ? trimmed : undefined
        } catch {
            return undefined
        }
    }

    function snapshotHeaders(headers: Headers): Record<string, string> {
        const entries: Record<string, string> = {}
        headers.forEach((value, key) => {
            entries[key] = value
        })
        return entries
    }

    async function njFetch(input: FetchInput, init?: FetchInit): Promise<Result<Response, NjFetchError>> {
        const fetchResult = await nj(fetch(input, init))
        if(!fetchResult.ok) {
            return err({
                kind: 'network',
                error: fetchResult.error,
            })
        }

        const response = fetchResult.value
        if(response.ok) {
            return ok(response)
        }

        return err({
            kind: 'http',
            status: response.status,
            statusText: response.statusText,
            url: response.url || String(input),
            bodyText: await readBodyText(response),
            headers: snapshotHeaders(response.headers),
        })
    }

    example('Discriminating network vs HTTP failures', async () => {
        const offlineFetch = mock(() => Promise.reject(new Error('ECONNREFUSED')))
        const missingFetch = mock(async () => new Response(JSON.stringify({message: 'missing'}), {
            status: 404,
            statusText: 'Not Found',
            headers: {'Content-Type': 'application/json'},
        }))

        try {
            globalThis.fetch = offlineFetch as unknown as typeof fetch
            const offline = await njFetch('https://api.example.test/offline')
            log('offline.kind', offline.ok ? 'ok' : offline.error.kind)
            if(!offline.ok && offline.error.kind === 'network') {
                log('offline.message', offline.error.error.message)
            }
            expect(offlineFetch).toHaveBeenCalled()

            globalThis.fetch = missingFetch as unknown as typeof fetch
            const missing = await njFetch('https://api.example.test/missing')
            log('missing.kind', missing.ok ? 'ok' : missing.error.kind)
            if(!missing.ok && missing.error.kind === 'http') {
                log('missing.status', missing.error.status)
                log('missing.body', missing.error.bodyText)
                log('missing.headers', missing.error.headers)
            }
            expect(missingFetch).toHaveBeenCalled()
        } finally {
            globalThis.fetch = originalFetch
        }
    })
})

await runExamples()
