import {err, ok, type Result} from '../result.ts'
import {expectType, type TypeEqual} from './type-assert.ts'

const pFail = 1/Math.sqrt(2)

export function mayFail1(): Result<number,string> { return Math.random() < pFail ? ok(1) : err('oh no')}
export function mayFail2() { return Math.random() < pFail ? ok(2) : err('err0r')}

expectType<TypeEqual<typeof mayFail1, typeof mayFail2>>(true)

export function alwaysThrows(): never { throw new Error('boom') }

/**
 * A function that may throw an error randomly based on a probability.
 *
 * @return {number} Returns the number 3 if no error is thrown.
 * @throws {Error} Throws an error with the message 'boom' if a failure condition is met.
 */
export function mayThrow1() {
    if(Math.random() < pFail) throw new Error('boom')
    return 3
}

/**
 * Executes a probabilistic operation that may throw an error based on a random condition.
 *
 * @return {void} Does not return a value. May throw an error if the random condition is met.
 */
export function mayThrow2() {
    if(Math.random() < pFail) throw new Error('boom')
}
