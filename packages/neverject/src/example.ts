#!/usr/bin/env -S bun
import {err, nj, ok, type SyncResult} from '.'
import * as nju from './util'

{
    const myResult = ok({myData: 'test'}) // instance of `Ok`

    console.log(myResult.ok)  // true
    console.log(myResult.value)  // { myData: 'test' }
}
{
    const myResult = err('Oh noooo') // instance of `Err`

    console.log(myResult.ok)  // false
    console.log(myResult.error)  // 'Oh noooo'
}
{  // https://github.com/supermacro/neverthrow?tab=readme-ov-file#okasync
    const myAsyncResult = nj({myData: 'test'}) // instance of `AsyncResult`
    const myResult = await myAsyncResult

    myResult.ok  // true
    console.log(myResult)
}
{  // https://github.com/supermacro/neverthrow?tab=readme-ov-file#errasync
    const myAsyncResult1 = nj(err('Oh nooo')) // instance of `AsyncResult`
    const myResult1 = await myAsyncResult1

    myResult1.ok  // false
    console.log(myResult1)

    const myAsyncResult2 = nj(new Error('err0r')) // instance of `AsyncResult`
    const myResult2 = await myAsyncResult2

    if(!myResult2.ok) {
        console.log(myResult2.error.message)
    }
}
{
    const tuple = <T extends any[]>(...args: T): T => args

    const combinedArray = await nju.allOk([nj('a'), nj(2)] as const)
    const combinedTuple = await nju.allOk(tuple(nj('a'), nj(2)))
}
{  // https://github.com/supermacro/neverthrow?tab=readme-ov-file#safetry
    function mayFail1(): SyncResult<number,string> { return Math.random() < 0.5 ? ok(1) : err('oh no')}
    function mayFail2(): SyncResult<number,string> { return Math.random() < 0.5 ? ok(2) : err('err0r')}

    function myFunc(): SyncResult<number, string> {
        const result1 = mayFail1()
        if(!result1.ok) return result1

        const result2 = mayFail2()
        if(!result2.ok) return result2

        return ok(result1.value + result2.value)
    }

    console.log(myFunc())
}


// TODO:c opy the JSON.parse example from
// https://github.com/supermacro/neverthrow?tab=readme-ov-file#resultfromthrowable-static-class-method
