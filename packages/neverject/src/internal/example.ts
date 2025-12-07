#!/usr/bin/env -S bun
import {err, nj, ok, type Result} from '../index.ts'
import * as njAgg from '../aggregate'
import * as njInvoke from '../invoke'
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

        const combinedTuple = await njAgg.allOk(tuple(nj('a'), nj(2)))
        const combinedArray = await njAgg.allOk([nj('a'), Promise.reject(2)] as const)

        log('combined tuple', combinedTuple)
        log('combined array', combinedArray)
    })

    example('Combining object values with allOkRecord', async () => {
        const combined = await njAgg.allOkRecord({
            user: nj({id: 1, name: 'Ada'}),
            profile: nj({bio: 'Always learning'}),
        })

        log('allOkRecord result', combined)

        const failed = await njAgg.allOkRecord({
            user: nj({id: 1}),
            preferences: nj(err('missing preferences')),
        })

        log('allOkRecord failed result', failed)
    })

    example('Settling array entries with allSettled', async () => {
        const settled = await njAgg.allSettled([nj('a'), nj(err('boom'))] as const)

        log('allSettled result', settled)
    })

    example('Settling object entries with allSettledRecord', async () => {
        const settled = await njAgg.allSettledRecord({
            user: nj({id: 1}),
            profile: nj(err('missing profile')),
        })

        log('allSettledRecord result', settled)
    })

    example('Racing for the first settled entry with firstSettled', async () => {
        const flip = () => Math.random() < 0.5
        const slowAttempt = new Promise((resolve) =>
            setTimeout(() => resolve(flip() ? ok('slow success') : err('slow failure')), 25)
        )
        const fastAttempt = new Promise((resolve) =>
            setTimeout(() => resolve(flip() ? ok('fast success') : err('fast failure')), 5)
        )

        const settled = await njAgg.firstSettled([slowAttempt, fastAttempt] as const)

        log('firstSettled ok?', settled.ok)
        if(settled.ok) {
            log('firstSettled value', settled.value)
        } else {
            log('firstSettled error', settled.error)
        }
    })

    example('Grabbing earliest success with firstOk', async () => {
        const flip = () => Math.random() < 0.5
        const maybeWin = (label: string, delay: number) =>
            new Promise((resolve) => setTimeout(() => resolve(flip() ? ok(label) : err(`${label} failed`)), delay))

        const result = await njAgg.firstOk([maybeWin('fast attempt', 5), maybeWin('slow attempt', 20)] as const)
        log('firstOk (racing attempts) ok?', result.ok)
        if(result.ok) {
            log('firstOk value', result.value)
        } else {
            log('firstOk collected errors', result.error)
        }

        const retries = await njAgg.firstOk([maybeWin('retry 1', 10), maybeWin('retry 2', 15)] as const)
        log('firstOk (retries) found success?', retries.ok)
        log('firstOk (retries) payload', retries)
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
            return njInvoke.tryCall(() => {
                const result1 = mayFail1()
                if(!result1.ok) throw result1.error

                const result2 = mayFail2()
                if(!result2.ok) throw result2.error

                return result1.value + result2.value
            })
        }

        log('manual propagation', myFunc1())
        log('tryCall helper', myFunc2())
    })

    example('Safe JSON parsing with wrapFn', () => {
        type ParseError = {message: string}
        const toParseError = (): ParseError => ({message: 'Parse Error'})

        const safeJsonParse = njInvoke.wrapFn(JSON.parse, toParseError)

        const res = safeJsonParse('{')

        log('ok', res.ok)
        if(!res.ok) {
            log('parse failure message', res.error.message)
        }
    })
})

describe('Fetch helpers', () => {
    const originalFetch = globalThis.fetch

    type FetchUrl = string | URL | {toString(): string}
    type NjFetchInit = RequestInit & {url: FetchUrl}

    type NetworkFetchReason = 'abort' | 'not-allowed' | 'type' | 'other'
    type NetworkFetchError = {kind: 'network'; url: string; reason: NetworkFetchReason; error: Error}
    type HttpFetchError = {
        kind: 'http'
        status: number
        response: Response
    }
    type NjFetchError = NetworkFetchError | HttpFetchError

    function toNetworkReason(error: Error): NetworkFetchReason {
        if(error.name === 'AbortError') return 'abort'
        if(error.name === 'NotAllowedError') return 'not-allowed'
        if(error instanceof TypeError || error.name === 'TypeError') return 'type'
        return 'other'
    }

    async function njFetch(init: NjFetchInit): Promise<Result<Response, NjFetchError>> {
        const {url, ...rest} = init
        const request = new Request(url as any, rest as RequestInit)
        const fetchResult = await nj(fetch(request))
        if(!fetchResult.ok) {
            return err({
                kind: 'network',
                url: request.url,
                reason: toNetworkReason(fetchResult.error),
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
            response,
        })
    }

    example('Discriminating network vs HTTP failures', async () => {
        const offlineFetch = mock((_req: Request) => Promise.reject(new Error('ECONNREFUSED')))
        const missingFetch = mock(async (_req: Request) => new Response(JSON.stringify({message: 'missing'}), {
            status: 404,
            statusText: 'Not Found',
            headers: {'Content-Type': 'application/json'},
        }))

        try {
            globalThis.fetch = offlineFetch as unknown as typeof fetch
            const offline = await njFetch({url: new URL('/offline', 'https://api.example.test')})
            log('offline.kind', offline.ok ? 'ok' : offline.error.kind)
            if(!offline.ok && offline.error.kind === 'network') {
                log('offline.message', offline.error.error.message)
                log('offline.reason', offline.error.reason)
                log('offline.url', offline.error.url)
            }
            expect(offlineFetch).toHaveBeenCalled()

            globalThis.fetch = missingFetch as unknown as typeof fetch
            const missing = await njFetch({url: 'https://api.example.test/missing'})
            log('missing.kind', missing.ok ? 'ok' : missing.error.kind)
            if(!missing.ok && missing.error.kind === 'http') {
                log('missing.status', missing.error.status)
                const body = await missing.error.response.json()
                log('missing.body', body)
            }
            expect(missingFetch).toHaveBeenCalled()
        } finally {
            globalThis.fetch = originalFetch
        }
    })
})

await runExamples()
