import assert from 'node:assert'


// const ZERO = '0'.codePointAt(0)
// const a = 'a'.codePointAt(0)
// const A = 'A'.codePointAt(0)


export const ALPHABET = '0123456789bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ'
export const BASE = ALPHABET.length

const REVERSE = new Map(Array.from(ALPHABET, (v, i) => [v, i]))

console.log(REVERSE)


export function charToNum(ch: string): number {
    assert(ch?.length === 1)
    const value = REVERSE.get(ch)
    assert(value != null)
    return value
}

export function numToChar(num: number): string {
    return ALPHABET[num]
}
