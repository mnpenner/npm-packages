#!/usr/bin/env -S bun
import {err, nj, ok, type SyncResult} from '../index.ts'
import * as nju from '../util'
import {describe, example, log, runExamples} from './example-runner.ts'
import {mayFail1, mayFail2} from './test-functions.ts'

describe('Sync results', () => {
    example('Ok result', () => {
        const myResult = ok({myData: 'test'})

        log('ok', myResult.ok)
        log('value', myResult.value)
    })

    example('Err result', () => {
        const myResult = err('Oh noooo')

        log('ok', myResult.ok)
        log('error', myResult.error)
    })
})

describe('Async results', () => {
    example('Async Ok via nj', async () => { // https://github.com/supermacro/neverthrow?tab=readme-ov-file#okasync
        const myAsyncResult = nj({myData: 'test'})
        const myResult = await myAsyncResult

        log('ok', myResult.ok)
        log('result', myResult)
    })

    example('Async Err via nj', async () => { // https://github.com/supermacro/neverthrow?tab=readme-ov-file#errasync
        const myAsyncResult1 = nj(err('Oh nooo'))
        const myResult1 = await myAsyncResult1

        log('ok', myResult1.ok)
        log('result', myResult1)

        const myAsyncResult2 = nj(new Error('err0r'))
        const myResult2 = await myAsyncResult2

        if(!myResult2.ok) {
            log('error message', myResult2.error.message)
        }
    })
})

describe('Utilities', () => {
    example('Combining values with allOk', async () => {
        const tuple = <T extends any[]>(...args: T): T => args

        const combinedArray = await nju.allOk([nj('a'), nj(2)] as const)
        const combinedTuple = await nju.allOk(tuple(nj('a'), nj(2)))

        log('combined array', combinedArray)
        log('combined tuple', combinedTuple)
    })

    example('SafeTry style propagation', () => { // https://github.com/supermacro/neverthrow?tab=readme-ov-file#safetry
        function myFunc1(): SyncResult<number, string> {
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
})

await runExamples()

// TODO: copy the JSON.parse example from
// https://github.com/supermacro/neverthrow?tab=readme-ov-file#resultfromthrowable-static-class-method
