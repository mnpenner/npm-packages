import {BASE, charToNum, numToChar} from './alphabet'
import assert from 'assert'


/**
 * Division with remainder.
 */
export function divqr(a: number, b: number): [quotient: number, remainder: number] {
    assert(b !== 0)

    const quotient = Math.floor(a / b)
    const remainder = a - quotient * b

    return [quotient, remainder]
}

function isNegativeZero(num: number): num is -0 {
    return num === 0 && 1 / num === -Infinity;
}

export function numberToBase50(num: number): string {
    const isNeg = num < 0 || isNegativeZero(num)
    let out = ''

    if(isNeg) {
        num *= -1
    }

    let remainder: number

    do {
        [num, remainder] = divqr(num, BASE)
        out = numToChar(remainder) + out
    } while(num > 0)

    if(isNeg) {
        return '-' + out
    }

    return out
}

export function base50ToNumber(base50Str: string): number {
    let result = 0;
    let negate = 1;
    let i = 0

    if(base50Str.startsWith('-')) {
        negate = -1
        ++i
    }

    for (; i < base50Str.length; ++i) {
        const value = charToNum(base50Str[i]);
        result = result * BASE + value;
    }

    return result * negate
}
